module.exports = {
  apps : [{
    name        : "SILB",
    script      : "./js/main.js",
    env: {
      "NODE_ENV": "development",
    },
    env_production : {
      "NODE_ENV": "production"
    }
  }]
}
