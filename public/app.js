const server = 'https://us-central1-without-ceasing.cloudfunctions.net'

const letters = require('/library/letters.js');
const petitions = require('/library/petitions.js');
const countries = require('/library/countries.js');

const u = require('/library/include.js')['wlj-utilities'];

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
    $scope.screens = screens;
    $scope.letters = letters;
    $scope.countries = countries;
    $scope.petitions = petitions;

    $scope.todo = () => alert('TODO');

    function refreshPrayers() {
        console.log('refreshPrayers: entered');
        return $http.get(server + "/prayers").then((response) => {
            console.log('refreshPrayers', { response });
            $scope.state.prayers = [];
            for (let key in response.data) {
                let prayer = response.data[key];
                $scope.state.prayers.push(prayer);
            }
            updateLocalStorage();
        });
    }

    refreshPrayers();

    function resetLocalStorage() {
        // TODO: auto-detect country
        $scope.state = {};
        $scope.state.selectedCountry = 'United States';
        $scope.state.screen = screens.selectCountry;
        updateLocalStorage();
    }

    function loadLocalStorage() {
        let json = localStorage.getItem('state');
        console.log('loadLocalStorage: entered', {json});
        if (!json) {
            resetLocalStorage();
        }
        $scope.state = JSON.parse(json);
        if (!$scope.state.userId) {
            $scope.state.userId = uuidv4();
            updateLocalStorage();
        }
        if (!$scope.state.hasOwnProperty('currentPrayerIndex')) {
            $scope.state.currentPrayerIndex = 0;
            updateLocalStorage();
        }
    }

    loadLocalStorage();

    function updateLocalStorage() {
        console.log('updateLocalStorage: entered', { state: $scope.state });

        const json = JSON.stringify($scope.state);
        localStorage.setItem('state', json);

        loadLocalStorage();
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

    $scope.askSubmit = () => {
        const query = {
            userId: $scope.state.userId,
            letter: $scope.state.prayerRequest.name,
            petition: $scope.state.prayerRequest.petition,
        }
        $http.get(server + "/ask" + u.toQueryString(query)).then((response) => {
            console.log('askSubmit', { response });

            $scope.state.screen = screens.pray;
            updateLocalStorage();
        });
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
            console.log('askSubmit', { response });

            $scope.state.screen = screens.pray;
            updateLocalStorage();
        });
    };

    $scope.getCurrentPrayer = () => {
        return $scope.state.prayers[$scope.state.currentPrayerIndex];
    }
});