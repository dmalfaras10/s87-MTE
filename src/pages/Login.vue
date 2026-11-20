<script setup>
    import { watch, ref, onBeforeMount } from 'vue';
    import { Notyf } from 'notyf';
    import { useRouter } from 'vue-router';
    import { useGlobalStore } from '../stores/global.js';
    import api from '../api.js';

    const email = ref("");
    const password = ref("");
    const isEnabled = ref(false);
    const notyf = new Notyf();
    const router = useRouter();
    const globalStore = useGlobalStore();

    watch([email, password], (currentValue) => {
        if (currentValue.every(input => input !== "")) {
            isEnabled.value = true;
        } else {
            isEnabled.value = false;
        }
    });

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            let response = await api.post('/users/login', {
                email: email.value,
                password: password.value
            });

            if (response.status === 200 || response.status === 201) {
                const token = response.data.access || response.data.token;
                if (token) {
                    localStorage.setItem('token', token);
                    await globalStore.getUserDetails(token);
                }

                notyf.success(response.data.message || "Welcome back! Ready to train.");
                email.value = "";
                password.value = "";
                router.push({ path: '/workouts' });
            }
        } catch (e) {
            if (e.response?.status === 400 || e.response?.status === 401) {
                notyf.error(e.response.data.error || e.response.data.message || "Invalid email or password.");
            } else {
                notyf.error("Login Failed. Please contact administrator.");
            }
        }
    }

    onBeforeMount(() => {
        if (globalStore.user.token) {
            router.push({ path: "/" });
        }
    });
</script>

<template>
    <div class="login-wrapper d-flex align-items-start justify-content-center pt-5">
        <div class="container py-4">
            <div class="row justify-content-center">
                <div class="col-md-7 col-lg-6">
                    <div class="login-header text-center mb-4">
                        <div class="login-badge d-inline-flex align-items-center justify-content-center rounded-circle mb-3">
                            <i class="bi bi-activity fs-3"></i>
                        </div>
                        <h2 class="login-title fw-bold mb-1">Welcome Back, Athlete</h2>
                        <p class="login-subtitle small">Log in to track your workouts, streaks, and progress</p>
                    </div>

                    <!-- Form Card Container -->
                    <div class="login-card rounded-4 p-4 p-sm-5">
                        <form v-on:submit="handleSubmit">
                            <!-- Email Address -->
                            <div class="login-field mb-3">
                                <label for="loginEmailInput" class="login-label form-label fw-medium small">Email Address</label>
                                <div class="login-input-group input-group">
                                    <span class="login-addon input-group-text">
                                        <i class="bi bi-envelope"></i>
                                    </span>
                                    <input 
                                        type="email" 
                                        class="login-input form-control shadow-none" 
                                        id="loginEmailInput" 
                                        v-model="email" 
                                        placeholder="athlete@example.com" 
                                    />
                                </div>
                            </div>

                            <!-- Password Field -->
                            <div class="login-field mb-4">
                                <label for="loginPasswordInput" class="login-label form-label fw-medium small">Password</label>
                                <div class="login-input-group input-group">
                                    <span class="login-addon input-group-text">
                                        <i class="bi bi-lock"></i>
                                    </span>
                                    <input 
                                        type="password" 
                                        class="login-input form-control shadow-none" 
                                        id="loginPasswordInput" 
                                        v-model="password" 
                                        placeholder="••••••••" 
                                    />
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <div class="d-grid mt-4 pt-2">
                                <button type="submit" class="login-submit login-submit--enabled py-3 rounded-pill fw-semibold" v-if="isEnabled">
                                    Start Session <i class="bi bi-arrow-right ms-1"></i>
                                </button>
                                <button type="submit" class="login-submit login-submit--disabled py-3 rounded-pill fw-semibold" disabled v-else>
                                    Start Session
                                </button>
                            </div>
                        </form>

                        <!-- Register Link -->
                        <div class="login-footer text-center mt-4 pt-3">
                            <span class="login-footer-text small">New to the tracker?</span>
                            <router-link to="/register" class="login-register-link small fw-semibold ms-1">Create your fitness profile</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>