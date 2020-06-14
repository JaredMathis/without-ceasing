const letters = require('/library/letters.js');
const petitions = require('/library/petitions.js');
const countries = require('/library/countries.js');

const u = require('/library/include.js')['wlj-utilities'];
const api = require('/library/include.js')['without-ceasing-lambda/aws-apigateway.json'];

async function callApi($http, lambdaName, data) {
    let apiId = api[lambdaName]["default"];
    let result = await $http.post(`https://${apiId}.execute-api.us-east-1.amazonaws.com/prod`, data);
    let parsed = JSON.parse(result.data)
    console.log('callApi', {lambdaName,parsed});
    if (parsed.success === false) {
        throw new Error('callApi failed to ' + lambdaName);
    }
    return parsed.result;
}

// https://stackoverflow.com/a/2117523/569302
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

const screens = {
    selectCountry: 'selectCountry',
    pray: 'pray',
    ask: 'ask',
};

const unspoken = "Unspoken";

angular.module('app', []);

angular.module('app').controller('HomeController', 
($scope, $http)=>{
    $scope.state = {};

    const defaultState = {
        selectedCountry: 'United States',
        screen: screens.selectCountry,
        prayer: {
            petition: 0,
            letter: 0,
        },
    };
    u.merge($scope.state, defaultState);
    console.log('Loaded default state');

    let json = localStorage.getItem('state');
    if (json !== null) {
        console.log('Parsing localStorage state')
        const parsed = JSON.parse(json);
        u.merge($scope.state, parsed);
    } else {
        console.log('No localStorage state')
    }

    $scope.screens = screens;
    $scope.letters = letters;
    $scope.countries = countries;
    $scope.petitions = petitions;

    $scope.$watch('state', updateLocalStorage, true)

    function updateLocalStorage() {
        console.log('updateLocalStorage: entered', { state: $scope.state });

        const json = JSON.stringify($scope.state);
        localStorage.setItem('state', json);
    }

    $scope.selectCountry = () => {
        $scope.state.screen = screens.pray;
        updateLocalStorage();
    };
    $scope.noCountry = () => {
        $scope.state.selectedCountry = unspoken;
        $scope.selectCountry();
    };

    $scope.ask = () => {
        $scope.state.screen = screens.ask;
        $scope.state.prayerRequest = {};
        updateLocalStorage();        
    };

    $scope.stateChanged = () => {
        updateLocalStorage();
    }

    $scope.requestPrayer = async () => {
        const query = {
            userId: $scope.state.userId,
            name: $scope.state.prayerRequest.name,
            petition: $scope.state.prayerRequest.petition,
        };
        let response = await callApi($http, 'wcRequestPrayer', query);

        $scope.state.screen = screens.pray;
        updateLocalStorage();
        $scope.$digest();
    };

    $scope.pray = () => {
        let currentPrayer = $scope.getCurrentPrayer();
        const query = {
            prayerUserId: currentPrayer.userId,
            letter: currentPrayer.letter.toString(),
            petition: currentPrayer.petition.toString(),
            userId: $scope.state.userId,
            country: $scope.state.selectedCountry,
        }
        $http.get(server + "/pray" + u.toQueryString(query)).then((response) => {
            console.log('pray', { response });

            $scope.state.screen = screens.pray;
            updateLocalStorage();
        });
    };

    $scope.getCurrentPrayer = () => {
        return $scope.state.prayer;
    }
});