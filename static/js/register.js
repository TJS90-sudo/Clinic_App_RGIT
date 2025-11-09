const registerForm = document.getElementById("registerForm");
registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  console.log("Form submitted");

  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const passwordError = document.getElementById("passwordError");

  if (password !== confirmPassword) {
    passwordError.style.display = "block";
    console.log("Passwords do not match");
    return;
  } else {
    passwordError.style.display = "none";
  }

  const formData = new FormData(registerForm);
  const formBody = new URLSearchParams(formData);
  console.log("Form data prepared:", [...formData]);

  try {
    console.log("Sending POST /auth/register");
    const response = await fetch("/auth/register", {
      method: "POST",
      body: formBody,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      console.log("Registration successful, fetching /users/profile...");

      const response2 = await fetch("/users/profile", {
        method: "POST",
        body: formBody,
        credentials: "include"
      });

      const data2 = await response2.json();
      console.log("Profile data:", data2);
    } else {
      console.log("Registration failed:", data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
});
