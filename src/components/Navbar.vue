<script setup>
    import { ref, onMounted, onBeforeUnmount } from 'vue';
    import { useRouter } from 'vue-router';
    import { useGlobalStore } from '../stores/global.js';

    const isDropdownOpen = ref(false);
    const dropdownRef = ref(null);
    const router = useRouter();
    const globalStore = useGlobalStore();

    function toggleDropdown() {
        isDropdownOpen.value = !isDropdownOpen.value;
    }

    function closeDropdown() {
        isDropdownOpen.value = false;
    }

    function handleNavigate(path) {
        isDropdownOpen.value = false;
        router.push({ path });
    }

    function handleLogout() {
        isDropdownOpen.value = false;
        localStorage.removeItem('token');
        if (globalStore.user) {
            globalStore.user.token = null;
            globalStore.user.email = null;
        }
        router.push({ path: '/login' });
    }

    function handleClickOutside(event) {
        if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
            isDropdownOpen.value = false;
        }
    }

    onMounted(() => {
        document.addEventListener('click', handleClickOutside);
    });

    onBeforeUnmount(() => {
        document.removeEventListener('click', handleClickOutside);
    });
</script>

<template>
    <nav class="navbar-wrapper sticky-top">
        <div class="container d-flex align-items-center justify-content-between py-3">
            <!-- Brand Only -->
            <router-link to="/workouts" class="navbar-brand-link d-inline-flex align-items-center gap-2 text-decoration-none" v-on:click="closeDropdown">
                <span class="navbar-brand-badge d-inline-flex align-items-center justify-content-center rounded-circle">
                    <i class="bi bi-activity fs-5"></i>
                </span>
                <span class="navbar-brand-text fw-bold">FitPulse</span>
            </router-link>

            <!-- Profile Icon Dropdown -->
            <div ref="dropdownRef" class="navbar-profile position-relative">
                <button
                    type="button"
                    class="navbar-profile-btn rounded-circle d-inline-flex align-items-center justify-content-center"
                    aria-label="Profile menu"
                    :aria-expanded="isDropdownOpen"
                    v-on:click.stop="toggleDropdown"
                >
                    <i class="bi bi-person-fill fs-5"></i>
                </button>

                <div v-if="isDropdownOpen" class="navbar-dropdown rounded-4 py-2">
                    <template v-if="!globalStore.user?.token">
                        <button
                            type="button"
                            class="navbar-dropdown-item d-flex align-items-center gap-2 w-100 px-3 py-2 small fw-medium"
                            v-on:click="handleNavigate('/login')"
                        >
                            <i class="bi bi-box-arrow-in-right"></i>
                            <span>Login</span>
                        </button>
                        <button
                            type="button"
                            class="navbar-dropdown-item d-flex align-items-center gap-2 w-100 px-3 py-2 small fw-medium"
                            v-on:click="handleNavigate('/register')"
                        >
                            <i class="bi bi-person-plus"></i>
                            <span>Register</span>
                        </button>
                    </template>

                    <template v-else>
                        <div class="navbar-dropdown-header px-3 py-1.5 small">
                            {{ globalStore.user.email || 'Athlete Account' }}
                        </div>
                        <button
                            type="button"
                            class="navbar-dropdown-item navbar-dropdown-item--danger d-flex align-items-center gap-2 w-100 px-3 py-2 small fw-medium"
                            v-on:click="handleLogout"
                        >
                            <i class="bi bi-box-arrow-right"></i>
                            <span>Logout</span>
                        </button>
                    </template>
                </div>
            </div>
        </div>
    </nav>
</template>