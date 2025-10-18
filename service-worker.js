self.addEventListener("install", (e) => {
  console.log("Service Worker Installed");
});

self.addEventListener("fetch", (e) => {
  // Offline caching yaha add kar sakte ho future me
});
