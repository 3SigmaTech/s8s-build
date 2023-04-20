
result=${PWD##*/}          # to assign to a variable
result=${result:-/}        # to correct for the case where PWD=/

nvm use 18
npm run deploy
npm pack --pack-destination ~/Repos/
echo "Updating package in S8S API Rep"
cd ../s8s-api/
npm update $result
echo "Broadcasting vendor/vendor.js file update"
echo "" >> ./vendor/vendor.ts