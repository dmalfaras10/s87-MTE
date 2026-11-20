<script setup>
    const currentYear = new Date().getFullYear();
</script>

<template>
    <footer class="footer-wrapper mt-auto">
        <div class="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 py-3">
            <div class="d-flex align-items-center gap-2">
                <span class="footer-badge d-inline-flex align-items-center justify-content-center rounded-circle">
                    <i class="bi bi-activity small"></i>
                </span>
                <span class="footer-brand fw-semibold small">FitPulse</span>
            </div>

            <p class="footer-copy small mb-0">
                &copy; {{ currentYear }} FitPulse. Track every session.
            </p>
        </div>
    </footer>
</template>