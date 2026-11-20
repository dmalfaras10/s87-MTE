<script setup>
    import { watch, ref, onBeforeMount } from 'vue';
    import { Notyf } from 'notyf';
    import { useRouter } from 'vue-router';
    import { useGlobalStore } from '../stores/global.js';
    import api from '../api.js';

    const email = ref("");
    const password = ref("");
    const confirmPass = ref("");
    const isEnabled = ref(false);
    const notyf = new Notyf();
    const router = useRouter();
    const { user } = useGlobalStore();

    watch([email, password, confirmPass], (currentValue) => {
        if (currentValue.every(input => input !== "") && currentValue[1] === currentValue[2]) {
            isEnabled.value = true;
        } else {
            isEnabled.value = false;
        }
    });

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            let response = await api.post('/users/register', {
                email: email.value,
                password: password.value
            });

            if (response.status === 201) {
                notyf.success(response.data.message || "Fitness profile created!");
                email.value = "";
                password.value = "";
                confirmPass.value = "";
                router.push({ path: '/login' });
            }
        } catch (e) {
            if (e.response?.status === 400) {
                notyf.error(e.response.data.error);
            } else {
                notyf.error("Registration Failed. Please contact administrator.");
            }
        }
    }

    onBeforeMount(() => {
        if (user.token) {
            router.push({ path: "/" });
        }
    });
</script>

<template>
    <div class="register-wrapper d-flex align-items-start justify-content-center pt-5">
        <div class="container py-4">
            <div class="row justify-content-center">
                <div class="col-md-7 col-lg-6">
                    <div class="register-header text-center mb-4">
                        <div class="register-badge d-inline-flex align-items-center justify-content-center rounded-circle mb-3">
                            <i class="bi bi-activity fs-3"></i>
                        </div>
                        <h2 class="register-title fw-bold mb-1">Create Your Fitness Profile</h2>
                        <p class="register-subtitle small">Start logging workouts, building streaks, and tracking progress</p>
                    </div>

                    <!-- Form Card Container -->
                    <div class="register-card rounded-4 p-4 p-sm-5">
                        <form v-on:submit="handleSubmit">
                            <!-- Email Address -->
                            <div class="register-field mb-3">
                                <label for="emailInput" class="register-label form-label fw-medium small">Email Address</label>
                                <div class="register-input-group input-group">
                                    <span class="register-addon input-group-text">
                                        <i class="bi bi-envelope"></i>
                                    </span>
                                    <input 
                                        type="email" 
                                        class="register-input form-control shadow-none" 
                                        id="emailInput" 
                                        v-model="email" 
                                        placeholder="athlete@example.com" 
                                    />
                                </div>
                            </div>

                            <!-- Password Fields -->
                            <div class="register-field mb-3">
                                <label for="passwordInput" class="register-label form-label fw-medium small">Password</label>
                                <div class="register-input-group input-group">
                                    <span class="register-addon input-group-text">
                                        <i class="bi bi-lock"></i>
                                    </span>
                                    <input 
                                        type="password" 
                                        class="register-input form-control shadow-none" 
                                        id="passwordInput" 
                                        v-model="password" 
                                        placeholder="••••••••" 
                                    />
                                </div>
                            </div>

                            <div class="register-field mb-4">
                                <label for="cpasswordInput" class="register-label form-label fw-medium small">Confirm Password</label>
                                <div class="register-input-group input-group">
                                    <span class="register-addon input-group-text">
                                        <i class="bi bi-shield-check"></i>
                                    </span>
                                    <input 
                                        type="password" 
                                        class="register-input form-control shadow-none" 
                                        id="cpasswordInput" 
                                        v-model="confirmPass" 
                                        placeholder="••••••••" 
                                    />
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <div class="d-grid mt-4 pt-2">
                                <button type="submit" class="register-submit register-submit--enabled py-3 rounded-pill fw-semibold" v-if="isEnabled">
                                    Create Account <i class="bi bi-arrow-right ms-1"></i>
                                </button>
                                <button type="submit" class="register-submit register-submit--disabled py-3 rounded-pill fw-semibold" disabled v-else>
                                    Create Account
                                </button>
                            </div>
                        </form>

                        <!-- Login Link -->
                        <div class="register-footer text-center mt-4 pt-3">
                            <span class="register-footer-text small">Already training with us?</span>
                            <router-link to="/login" class="register-login-link small fw-semibold ms-1">Sign in</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>