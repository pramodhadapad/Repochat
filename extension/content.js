const repoUrl = window.location.href;
const isRepo = /github\.com\/[^/]+\/[^/]+(\/)?$/.test(repoUrl);

if (isRepo) {
  const btn = document.createElement('div');
  btn.innerHTML = `
    <div id="repochat-btn" style="position: fixed; bottom: 30px; right: 30px; z-index: 9999; cursor: pointer;">
      <div style="background: #0ea5e9; color: white; padding: 12px 20px; border-radius: 16px; font-weight: bold; box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.4); display: flex; items-center; gap: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        Open in RepoChat
      </div>
    </div>
  `;
  document.body.appendChild(btn);

  btn.onclick = () => {
    const appUrl = "http://localhost:3000/dashboard?import=" + encodeURIComponent(repoUrl);
    window.open(appUrl, '_blank');
  };
}
