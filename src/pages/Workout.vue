<script setup>
    import Navbar from '../components/Navbar.vue'
    import Footer from '../components/Footer.vue'
    import { ref, computed, watch, onMounted } from 'vue';
    import { Notyf } from 'notyf';
    import api from '../api.js';

    const pageSize = 10;
    const currentPage = ref(1);

    const searchQuery = ref("");
    const statusFilter = ref("all");

    const workouts = ref([]);
    const isLoading = ref(false);
    const isSaving = ref(false);
    const deletingId = ref(null);
    const togglingId = ref(null);

    const isModalOpen = ref(false);
    const modalMode = ref('add');
    const editingId = ref(null);

    const workoutName = ref("");
    const workoutDuration = ref("");

    const notyf = new Notyf();

    const isFormValid = computed(() => {
        const dur = Number(workoutDuration.value);
        return workoutName.value.trim() !== "" && !Number.isNaN(dur) && dur > 0;
    });

    const filteredWorkouts = computed(() => {
        const query = searchQuery.value.trim().toLowerCase();
        return workouts.value.filter((item) => {
            const matchesSearch = !query || item.name.toLowerCase().includes(query);
            const matchesStatus =
                statusFilter.value === 'all' ||
                (statusFilter.value === 'completed' && item.completed) ||
                (statusFilter.value === 'pending' && !item.completed);
            return matchesSearch && matchesStatus;
        });
    });

    const totalMinutes = computed(() => {
        return filteredWorkouts.value.reduce((sum, item) => sum + (Number(item.duration) || 0), 0);
    });

    const totalPages = computed(() => {
        return Math.max(1, Math.ceil(filteredWorkouts.value.length / pageSize));
    });

    const paginatedWorkouts = computed(() => {
        const start = (currentPage.value - 1) * pageSize;
        return filteredWorkouts.value.slice(start, start + pageSize);
    });

    const pageNumbers = computed(() => {
        return Array.from({ length: totalPages.value }, (_, index) => index + 1);
    });

    const showingRangeText = computed(() => {
        if (filteredWorkouts.value.length === 0) return 'Showing 0 of 0';
        const start = (currentPage.value - 1) * pageSize + 1;
        const end = Math.min(currentPage.value * pageSize, filteredWorkouts.value.length);
        return `Showing ${start}–${end} of ${filteredWorkouts.value.length}`;
    });

    watch([searchQuery, statusFilter], () => {
        currentPage.value = 1;
    });

    watch(totalPages, (maxPage) => {
        if (currentPage.value > maxPage) {
            currentPage.value = maxPage;
        }
    });

    function clearFilters() {
        searchQuery.value = "";
        statusFilter.value = "all";
        currentPage.value = 1;
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages.value || page === currentPage.value) return;
        currentPage.value = page;
    }

    function isCompletedStatus(status) {
        if (typeof status === 'boolean') return status;
        const normalized = String(status || '').toLowerCase();
        return normalized === 'completed' || normalized === 'complete' || normalized === 'done';
    }

    function normalizeWorkout(item) {
        const rawStatus = item.status ?? (item.completed ? 'completed' : 'pending');
        return {
            _id: item._id || item.id,
            name: item.name || "",
            duration: Number(item.duration) || 0,
            status: rawStatus,
            completed: isCompletedStatus(rawStatus)
        };
    }

    async function fetchWorkouts() {
        isLoading.value = true;
        try {
            const response = await api.get('/workouts/getMyWorkouts');
            const list = Array.isArray(response.data)
                ? response.data
                : (response.data.workouts || response.data.data || []);
            workouts.value = list.map(normalizeWorkout);
            if (currentPage.value > totalPages.value) {
                currentPage.value = totalPages.value;
            }
        } catch (e) {
            notyf.error(e.response?.data?.error || e.response?.data?.message || "Failed to load workouts.");
        } finally {
            isLoading.value = false;
        }
    }

    function openAddModal() {
        modalMode.value = 'add';
        editingId.value = null;
        workoutName.value = "";
        workoutDuration.value = "";
        isModalOpen.value = true;
    }

    function openEditModal(workout) {
        modalMode.value = 'edit';
        editingId.value = workout._id || workout.id;
        workoutName.value = workout.name;
        workoutDuration.value = String(workout.duration);
        isModalOpen.value = true;
    }

    function closeModal(force = false) {
        if (isSaving.value && !force) return;
        isModalOpen.value = false;
        editingId.value = null;
        workoutName.value = "";
        workoutDuration.value = "";
    }

    async function handleSaveWorkout(e) {
        e.preventDefault();
        if (!isFormValid.value) return;

        isSaving.value = true;
        const payload = {
            name: workoutName.value.trim(),
            duration: Number(workoutDuration.value)
        };

        try {
            if (modalMode.value === 'add') {
                const response = await api.post('/workouts/addWorkout', payload);
                await fetchWorkouts();
                currentPage.value = 1;
                notyf.success(response.data.message || "Workout added!");
            } else {
                const response = await api.patch(`/workouts/updateWorkout/${editingId.value}`, payload);
                await fetchWorkouts();
                notyf.success(response.data.message || "Workout updated!");
            }

            isSaving.value = false;
            closeModal(true);
        } catch (e) {
            console.error("Save workout error:", e.response?.data || e);
            notyf.error(e.response?.data?.error || e.response?.data?.message || "Could not save workout.");
        } finally {
            isSaving.value = false;
        }
    }

    async function handleToggleComplete(workout) {
        const targetId = workout._id || workout.id;
        if (!targetId) return;

        togglingId.value = targetId;
        const nextCompleted = !workout.completed;
        const nextStatus = nextCompleted ? 'completed' : 'pending';

        try {
            const response = await api.patch(`/workouts/completeWorkoutStatus/${targetId}`, {
                status: nextStatus,
                completed: nextCompleted
            });
            await fetchWorkouts();
            notyf.success(
                response.data.message || (nextCompleted ? "Workout marked as completed!" : "Workout marked as pending.")
            );
        } catch (e) {
            console.error("Toggle complete error:", e.response?.data || e);
            notyf.error(e.response?.data?.error || e.response?.data?.message || "Failed to update workout status.");
        } finally {
            togglingId.value = null;
        }
    }

    async function handleDeleteWorkout(workoutId) {
        deletingId.value = workoutId;
        try {
            const response = await api.delete(`/workouts/deleteWorkout/${workoutId}`);
            workouts.value = workouts.value.filter((item) => item._id !== workoutId);
            notyf.success(response.data.message || "Workout deleted.");
        } catch (e) {
            notyf.error(e.response?.data?.error || e.response?.data?.message || "Failed to delete workout.");
        } finally {
            deletingId.value = null;
        }
    }

    onMounted(() => {
        fetchWorkouts();
    });
</script>

<template>
    <Navbar />
    <div class="workout-wrapper py-5">
        <div class="container">
            <!-- Page Header -->
            <div class="workout-header d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
                <div class="d-flex align-items-center gap-3">
                    <div class="workout-badge d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0">
                        <i class="bi bi-activity fs-4"></i>
                    </div>
                    <div>
                        <h2 class="workout-title fw-bold mb-0">Workouts</h2>
                        <p class="workout-subtitle small mb-0">
                            {{ filteredWorkouts.length }} {{ filteredWorkouts.length === 1 ? 'session' : 'sessions' }} • {{ totalMinutes }} total mins
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    class="workout-btn workout-btn--primary rounded-pill px-4 py-2 fw-semibold"
                    v-on:click="openAddModal"
                >
                    <i class="bi bi-plus-lg me-1"></i> Add Workout
                </button>
            </div>

            <!-- Search & Status Filter Toolbar -->
            <div v-if="!isLoading && workouts.length > 0" class="workout-toolbar rounded-4 p-3 mb-4">
                <div class="row g-3 align-items-center">
                    <div class="col-12 col-md-7">
                        <div class="workout-input-group input-group">
                            <span class="workout-addon input-group-text">
                                <i class="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                class="workout-input workout-input--compact form-control shadow-none"
                                v-model="searchQuery"
                                placeholder="Search workout by name..."
                            />
                            <button
                                v-if="searchQuery"
                                type="button"
                                class="workout-clear-btn px-3"
                                aria-label="Clear search"
                                v-on:click="searchQuery = ''"
                            >
                                <i class="bi bi-x-lg small"></i>
                            </button>
                        </div>
                    </div>

                    <div class="col-12 col-md-5 d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
                        <div class="workout-filter-group d-inline-flex rounded-pill p-1" role="group" aria-label="Filter by status">
                            <button
                                type="button"
                                class="workout-filter-btn rounded-pill px-3 py-1 small fw-medium"
                                :class="{ 'workout-filter-btn--active': statusFilter === 'all' }"
                                v-on:click="statusFilter = 'all'"
                            >
                                All
                            </button>
                            <button
                                type="button"
                                class="workout-filter-btn rounded-pill px-3 py-1 small fw-medium"
                                :class="{ 'workout-filter-btn--active': statusFilter === 'pending' }"
                                v-on:click="statusFilter = 'pending'"
                            >
                                Pending
                            </button>
                            <button
                                type="button"
                                class="workout-filter-btn rounded-pill px-3 py-1 small fw-medium"
                                :class="{ 'workout-filter-btn--active': statusFilter === 'completed' }"
                                v-on:click="statusFilter = 'completed'"
                            >
                                Completed
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="workout-table-card rounded-4 p-5 text-center">
                <div class="spinner-border workout-spinner mb-3" role="status"></div>
                <p class="workout-subtitle small mb-0">Loading your workouts...</p>
            </div>

            <!-- Empty State (No Workouts at All) -->
            <div v-else-if="workouts.length === 0" class="workout-table-card rounded-4 p-5 text-center">
                <div class="workout-empty-icon mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle">
                    <i class="bi bi-lightning-charge fs-3"></i>
                </div>
                <h5 class="workout-title fw-semibold mb-1">No workouts logged yet</h5>
                <p class="workout-subtitle small mb-4">Add your first workout name and duration to start tracking.</p>
                <button
                    type="button"
                    class="workout-btn workout-btn--primary rounded-pill px-4 py-2 fw-semibold"
                    v-on:click="openAddModal"
                >
                    <i class="bi bi-plus-lg me-1"></i> Add Workout
                </button>
            </div>

            <!-- No Matching Search / Filter Results -->
            <div v-else-if="filteredWorkouts.length === 0" class="workout-table-card rounded-4 p-5 text-center">
                <div class="workout-empty-icon mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle">
                    <i class="bi bi-funnel fs-3"></i>
                </div>
                <h5 class="workout-title fw-semibold mb-1">No matching workouts</h5>
                <p class="workout-subtitle small mb-4">Try a different search keyword or reset your status filter.</p>
                <button
                    type="button"
                    class="workout-btn workout-btn--ghost rounded-pill px-4 py-2 fw-semibold"
                    v-on:click="clearFilters"
                >
                    Reset Filters
                </button>
            </div>

            <!-- Workout Table -->
            <div v-else class="workout-table-card rounded-4 overflow-hidden">
                <div class="table-responsive">
                    <table class="table workout-table align-middle mb-0">
                        <thead>
                            <tr>
                                <th scope="col" class="workout-th py-3 ps-4">Workout</th>
                                <th scope="col" class="workout-th py-3">Duration</th>
                                <th scope="col" class="workout-th py-3">Status</th>
                                <th scope="col" class="workout-th py-3 pe-4 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="workout in paginatedWorkouts"
                                :key="workout._id"
                                class="workout-tr"
                                :class="{ 'workout-tr--completed': workout.completed }"
                            >
                                <td class="workout-td py-3 ps-4">
                                    <span
                                        class="workout-item-title fw-semibold"
                                        :class="{ 'workout-item-title--completed': workout.completed }"
                                    >
                                        {{ workout.name }}
                                    </span>
                                </td>
                                <td class="workout-td py-3">
                                    <span class="workout-duration-pill rounded-pill px-3 py-1 small fw-semibold">
                                        <i class="bi bi-clock me-1"></i>{{ workout.duration }} min
                                    </span>
                                </td>
                                <td class="workout-td py-3">
                                    <span
                                        class="workout-status-badge rounded-pill px-3 py-1 small fw-medium d-inline-flex align-items-center gap-1"
                                        :class="workout.completed ? 'workout-status-badge--done' : 'workout-status-badge--pending'"
                                    >
                                        <i :class="workout.completed ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
                                        {{ workout.completed ? 'Completed' : 'Pending' }}
                                    </span>
                                </td>
                                <td class="workout-td py-3 pe-4 text-end">
                                    <div class="d-inline-flex flex-wrap align-items-center justify-content-end gap-2">
                                        <button
                                            type="button"
                                            class="workout-btn rounded-pill px-3 py-1 small fw-medium"
                                            :class="workout.completed ? 'workout-btn--complete-active' : 'workout-btn--complete'"
                                            :disabled="togglingId === workout._id"
                                            v-on:click="handleToggleComplete(workout)"
                                        >
                                            <i :class="workout.completed ? 'bi bi-check2-circle me-1' : 'bi bi-check2 me-1'"></i>
                                            {{
                                                togglingId === workout._id
                                                    ? 'Updating...'
                                                    : (workout.completed ? 'Completed' : 'Mark Complete')
                                            }}
                                        </button>
                                        <button
                                            type="button"
                                            class="workout-btn workout-btn--ghost rounded-pill px-3 py-1 small fw-medium"
                                            v-on:click="openEditModal(workout)"
                                        >
                                            <i class="bi bi-pencil-square me-1"></i> Edit
                                        </button>
                                        <button
                                            type="button"
                                            class="workout-btn workout-btn--danger rounded-pill px-3 py-1 small fw-medium"
                                            :disabled="deletingId === workout._id"
                                            v-on:click="handleDeleteWorkout(workout._id)"
                                        >
                                            <i class="bi bi-trash3 me-1"></i>
                                            {{ deletingId === workout._id ? 'Deleting...' : 'Delete' }}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination Bar -->
                <div class="workout-pagination d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 px-4 py-3">
                    <span class="workout-subtitle small">
                        {{ showingRangeText }}
                    </span>

                    <div class="d-flex align-items-center gap-1.5">
                        <button
                            type="button"
                            class="workout-page-btn rounded-pill px-3 py-1 small fw-medium"
                            :disabled="currentPage === 1"
                            v-on:click="goToPage(currentPage - 1)"
                        >
                            <i class="bi bi-chevron-left me-1"></i> Prev
                        </button>

                        <button
                            v-for="page in pageNumbers"
                            :key="page"
                            type="button"
                            class="workout-page-num rounded-circle small fw-semibold"
                            :class="{ 'workout-page-num--active': currentPage === page }"
                            v-on:click="goToPage(page)"
                        >
                            {{ page }}
                        </button>

                        <button
                            type="button"
                            class="workout-page-btn rounded-pill px-3 py-1 small fw-medium"
                            :disabled="currentPage === totalPages"
                            v-on:click="goToPage(currentPage + 1)"
                        >
                            Next <i class="bi bi-chevron-right ms-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add / Edit Workout Modal -->
        <div
            v-if="isModalOpen"
            class="workout-modal-backdrop d-flex align-items-center justify-content-center p-3"
            v-on:click.self="closeModal"
        >
            <div class="workout-modal rounded-4 p-4 p-sm-5 w-100">
                <div class="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h4 class="workout-title fw-bold mb-1">
                            {{ modalMode === 'add' ? 'Add Workout' : 'Edit Workout' }}
                        </h4>
                        <p class="workout-subtitle small mb-0">
                            {{ modalMode === 'add' ? 'Log a new workout session' : 'Update your workout name or duration' }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="workout-close-btn rounded-circle d-inline-flex align-items-center justify-content-center"
                        aria-label="Close modal"
                        v-on:click="closeModal"
                    >
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>

                <form v-on:submit="handleSaveWorkout">
                    <!-- Workout Name -->
                    <div class="workout-field mb-3">
                        <label for="workoutNameInput" class="workout-label form-label fw-medium small">
                            Workout Name
                        </label>
                        <div class="workout-input-group input-group">
                            <span class="workout-addon input-group-text">
                                <i class="bi bi-person-arms-up"></i>
                            </span>
                            <input
                                type="text"
                                id="workoutNameInput"
                                class="workout-input form-control shadow-none"
                                v-model="workoutName"
                                placeholder="e.g., Morning Run, Push Day, HIIT"
                            />
                        </div>
                    </div>

                    <!-- Duration (Minutes) -->
                    <div class="workout-field mb-4">
                        <label for="workoutDurationInput" class="workout-label form-label fw-medium small">
                            Duration (minutes)
                        </label>
                        <div class="workout-input-group input-group">
                            <span class="workout-addon input-group-text">
                                <i class="bi bi-stopwatch"></i>
                            </span>
                            <input
                                type="number"
                                id="workoutDurationInput"
                                class="workout-input form-control shadow-none"
                                v-model="workoutDuration"
                                min="1"
                                step="1"
                                placeholder="e.g., 45"
                            />
                        </div>
                    </div>

                    <!-- Modal Actions -->
                    <div class="d-flex align-items-center justify-content-end gap-2 mt-4 pt-2">
                        <button
                            type="button"
                            class="workout-btn workout-btn--ghost rounded-pill px-4 py-2 fw-semibold"
                            v-on:click="closeModal"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="workout-btn workout-btn--primary rounded-pill px-4 py-2 fw-semibold"
                            :class="{ 'workout-btn--disabled': !isFormValid || isSaving }"
                            :disabled="!isFormValid || isSaving"
                        >
                            {{
                                isSaving
                                    ? 'Saving...'
                                    : (modalMode === 'add' ? 'Save Workout' : 'Update Workout')
                            }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <Footer />
</template>