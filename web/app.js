const letters = require('/library/letters.js');
const petitions = require('/library/petitions.js');
const countries = require('/library/countries.js');

const screens = {
    selectCountry: 'selectCountry',
    pray: 'pray',
    ask: 'ask',
};

const unspoken = "Unspoken";

angular.module('app', []);

angular.module('app').controller('HomeController', 
($scope)=>{
    $scope.screens = screens;
    $scope.letters = letters;
    $scope.countries = countries;
    $scope.petitions = petitions;

    $scope.todo = () => alert('TODO');

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
    }

    loadLocalStorage();

    function updateLocalStorage() {
        console.log('updateLocalStorage: entered');

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
        $scope.prayerRequest = {};
        updateLocalStorage();        
    };
});