/*
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // prevent page reload

  // Get form data
  const formData = new FormData(loginForm);

  // Convert it to URL-encoded format
  const formBody = new URLSearchParams(formData);

  // Send request
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded", // important
    },
    body: formBody, 
    credentials: 'include'
  });

  const result = await response.json();


  if (response.redirected) {
      window.location.href = response.url;  // manually follow redirect
  } else {
      const text = await response.text();   // handle error message like "Invalid username"
      console.log(text);
  }
});
*/
