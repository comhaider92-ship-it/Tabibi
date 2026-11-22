# TABIBI V110 safe security-fix report

Only npm audit fix without --force was used. Major-version upgrades were not forced.

## Backend

Totals: {"info":0,"low":3,"moderate":21,"high":12,"critical":1,"total":37}

| Package | Severity | Direct | Fix available |
|---|---|---:|---|
| @angular-devkit/core | moderate | false | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |
| @angular-devkit/schematics | moderate | false | true |
| @angular-devkit/schematics-cli | moderate | false | true |
| @google-cloud/firestore | moderate | false | {"name":"firebase-admin","version":"10.3.0","isSemVerMajor":true} |
| @google-cloud/storage | moderate | false | {"name":"firebase-admin","version":"10.3.0","isSemVerMajor":true} |
| @mapbox/node-pre-gyp | high | false | {"name":"bcrypt","version":"6.0.0","isSemVerMajor":true} |
| @nestjs/cli | high | true | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |
| @nestjs/common | moderate | true | true |
| @nestjs/config | high | true | {"name":"@nestjs/config","version":"12.1.1","isSemVerMajor":true} |
| @nestjs/core | moderate | true | {"name":"@nestjs/core","version":"12.6.0","isSemVerMajor":true} |
| @nestjs/platform-express | high | true | {"name":"@nestjs/platform-express","version":"12.6.0","isSemVerMajor":true} |
| @nestjs/schedule | moderate | true | {"name":"@nestjs/schedule","version":"12.0.4","isSemVerMajor":true} |
| @nestjs/schematics | moderate | true | {"name":"@nestjs/schematics","version":"11.1.0","isSemVerMajor":true} |
| @nestjs/typeorm | moderate | true | {"name":"@nestjs/typeorm","version":"12.0.3","isSemVerMajor":true} |
| ajv | moderate | false | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |
| bcrypt | high | true | {"name":"bcrypt","version":"6.0.0","isSemVerMajor":true} |
| body-parser | high | false | {"name":"@nestjs/platform-express","version":"12.6.0","isSemVerMajor":true} |
| external-editor | low | false | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |
| file-type | moderate | false | true |
| firebase-admin | moderate | true | {"name":"firebase-admin","version":"10.3.0","isSemVerMajor":true} |
| gaxios | moderate | false | true |
| glob | high | false | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |
| google-gax | moderate | false | {"name":"firebase-admin","version":"10.3.0","isSemVerMajor":true} |
| inquirer | low | false | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |
| lodash | high | false | {"name":"@nestjs/config","version":"12.1.1","isSemVerMajor":true} |
| minimatch | moderate | false | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |
| multer | high | false | {"name":"@nestjs/platform-express","version":"12.6.0","isSemVerMajor":true} |
| nodemailer | high | true | {"name":"nodemailer","version":"10.6.1","isSemVerMajor":true} |
| picomatch | high | false | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |
| qs | moderate | false | true |
| retry-request | moderate | false | {"name":"firebase-admin","version":"10.3.0","isSemVerMajor":true} |
| tar | critical | false | {"name":"bcrypt","version":"6.0.0","isSemVerMajor":true} |
| teeny-request | moderate | false | {"name":"firebase-admin","version":"10.3.0","isSemVerMajor":true} |
| tmp | high | false | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |
| typeorm | moderate | true | {"name":"typeorm","version":"1.1.3","isSemVerMajor":true} |
| uuid | moderate | false | {"name":"@nestjs/typeorm","version":"12.0.3","isSemVerMajor":true} |
| webpack | low | false | {"name":"@nestjs/cli","version":"12.0.15","isSemVerMajor":true} |

## Mobile

Totals: {"info":0,"low":0,"moderate":17,"high":5,"critical":1,"total":23}

| Package | Severity | Direct | Fix available |
|---|---|---:|---|
| @expo/bunyan | moderate | false | true |
| @expo/cli | high | false | true |
| @expo/config | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| @expo/config-plugins | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| @expo/fingerprint | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| @expo/metro-config | moderate | false | true |
| @expo/plist | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| @expo/prebuild-config | moderate | false | true |
| @expo/rudder-sdk-node | moderate | false | true |
| @xmldom/xmldom | high | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| cacache | high | false | true |
| expo | moderate | true | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| expo-asset | moderate | false | true |
| expo-constants | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| expo-notifications | moderate | true | {"name":"expo-notifications","version":"58.1.9","isSemVerMajor":true} |
| glob | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| image-size | high | false | true |
| minimatch | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| postcss | high | false | true |
| sucrase | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| tar | critical | false | true |
| uuid | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
| xcode | moderate | false | {"name":"expo","version":"57.0.33","isSemVerMajor":true} |
