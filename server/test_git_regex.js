const pattern = /^https?:\/\/[\w.-]+(\.[\w.-]+)+[\w\d._~:/?#[\]@!$&'()*+,;=.-]+$/;

const tests = [
  "https://github.com/owner/repo",
  "http://github.com/owner/repo.git",
  "https://gitlab.com/owner/repo/",
  "https://bitbucket.org/owner/repo",
  "https://my-private-gitea.com/user/project",
  "https://azure.dev.com/org/project/_git/repo",
  "invalid-url",
  "ftp://github.com"
];

tests.forEach(url => {
  console.log(`${url}: ${pattern.test(url)}`);
});
