module.exports = {
  "extends": [
    "next/core-web-vitals", 
    "plugin:security/recommended"
  ],
  "plugins": [
    "security"
  ],
  "rules": {
    "security/detect-object-injection": "error",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-no-csrf-before-method-override": "error",
    "no-eval": "error",
    "no-implied-eval": "error"
  }
};
