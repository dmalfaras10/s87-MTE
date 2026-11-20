<script setup>
    import { onBeforeMount } from 'vue';
    import { useRouter } from 'vue-router';
    import { useGlobalStore } from '../stores/global.js';

    const router = useRouter();
    const globalStore = useGlobalStore();

    onBeforeMount(() => {
        if (globalStore.user?.token || localStorage.getItem('token')) {
            router.push({ path: '/workouts' });
        }
    });
</script>

<template>
    <div class="landing-wrapper w-100 d-flex align-items-center justify-content-center py-5 px-3">
        <div class="landing-card rounded-4 p-4 p-sm-5 text-center">
            <span class="landing-pill badge rounded-pill px-3 py-2 mb-3 fw-semibold text-uppercase">
                <i class="bi bi-activity me-1"></i> FitPulse Workout Tracker
            </span>

            <h1 class="landing-title fw-bold display-5 mb-3">
                Build Consistency. Track Every Session.
            </h1>

            <p class="landing-subtitle fs-6 fs-sm-5 mb-4">
                Log workouts, track completion, and stay on top of your training routine in one simple space.
            </p>

            <div class="d-flex flex-column flex-sm-row justify-content-center gap-3">
                <router-link
                    to="/register"
                    class="landing-btn landing-btn--primary rounded-pill px-4 py-3 fw-semibold text-decoration-none d-inline-flex align-items-center justify-content-center gap-2"
                >
                    <i class="bi bi-person-plus"></i>
                    <span>Register</span>
                </router-link>

                <router-link
                    to="/login"
                    class="landing-btn landing-btn--secondary rounded-pill px-4 py-3 fw-semibold text-decoration-none d-inline-flex align-items-center justify-content-center gap-2"
                >
                    <i class="bi bi-box-arrow-in-right"></i>
                    <span>Login</span>
                </router-link>
            </div>
        </div>
    </div>
</template>