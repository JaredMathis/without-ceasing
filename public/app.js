const library = require('/library/include.js')['without-ceasing-library'];
const letters = library.getNames();
const petitions = library.getPetitions();
const countries = library.getCountries();

const u = require('/library/include.js')['wlj-utilities'];
const api = require('/library/include.js')['without-ceasing-lambda/aws-apigateway.json'];

async function callApi($http, lambdaName, data) {
    console.log('callApi', {lambdaName,data});
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
    requests: 'requests'
};

const unspoken = "Unspoken";

angular.module('app', []);

angular.module('app').controller('HomeController', 
($scope, $http)=>{
    $scope.state = {};

    const defaultState = {
        selectedCountry: 'United States',
        screen: screens.selectCountry,
        prayerRequests: [],
        currentPrayerIndex: 0,
        userId: uuidv4(),
        myRequestKeys: [],
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
    };

    $scope.noCountry = () => {
        $scope.state.selectedCountry = "Unknown";
        $scope.selectCountry();
    };

    $scope.ask = () => {
        $scope.state.screen = screens.ask;
        $scope.state.prayerRequest = {};
    };

    $scope.requestPrayer = async () => {
        $scope.requesting = true;
        const data = {
            userId: $scope.state.userId,
            name: $scope.state.prayerRequest.name,
            petition: $scope.state.prayerRequest.petition,
        };
        let response = await callApi($http, 'wcRequestPrayer', data);
        console.log('requestPrayer', {response});
        $scope.state.myRequestKeys.push(response.result.key);

        $scope.state.screen = screens.pray;
        $scope.requesting = false;
        $scope.$digest();
    };

    async function refreshPrayerRequests() {
        $scope.state.prayerRequests = [];
        $scope.state.prayerRequests 
            = await callApi($http, 'wcPrayerRequests', {});
        // Exclude requests from current user
        $scope.state.prayerRequests = $scope.state.prayerRequests
            .filter(p => p.data.request.userId !== $scope.state.userId)
        $scope.state.currentPrayerIndex = 0;
        $scope.$digest();
        console.log('refreshPrayerRequests leaving');
    }

    refreshPrayerRequests();

    $scope.pray = async () => {
        $scope.praying = true;
        const data = {
            country: $scope.state.selectedCountry,
            key: $scope.getCurrentPrayer().key,
        }
        await callApi($http, 'wcPray', data);
        $scope.state.currentPrayerIndex++;
        if ($scope.state.currentPrayerIndex >= $scope.state.prayerRequests.length) {
            refreshPrayerRequests();
        }
        $scope.praying = false;
        $scope.$digest();
    };

    $scope.getCurrentPrayer = () => {
        return $scope.state.prayerRequests[$scope.state.currentPrayerIndex];
    }

    $scope.prayerRequests = () => {
        $scope.state.screen = screens.requests;
    }

    $scope.$watch('state.screen', s => {
        if (s === screens.requests) {
            refreshMyRequests();
        }
    });

    async function refreshMyRequests() {
        console.log('refreshMyRequests entered');
        $scope.myRequests = [];

        u.loop($scope.state.myRequestKeys, key => {
            let data = {
                key,
            }
            callApi($http, 'wcPrayerRequest', data)
                .then((response) => {
                    $scope.myRequests.push(response);
                    $scope.$digest();
                })
        });
        
    }

    $scope.backToPrayers = () => {
        $scope.state.screen = screens.pray;
    }
});