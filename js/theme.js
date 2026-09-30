window.toggleTheme = function () {
    const body = document.body;

    body.classList.toggle("light-mode");

    if (body.classList.contains("light-mode")) {
        localStorage.setItem("theme", "light");
    } else {
        localStorage.setItem("theme", "dark");
    }
};

window.applySavedTheme = function () {
    const theme = localStorage.getItem("theme");

    if (theme === "light") {
        document.body.classList.add("light-mode");
    }
};

document.addEventListener("DOMContentLoaded", function () {
    window.applySavedTheme();
});