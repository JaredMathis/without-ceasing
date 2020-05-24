const countries = [
    "United States",
    "Mexico"
];

const screens = {
    selectedCountry: 'selectedCountry',
};


angular.module('app', []);

angular.module('app').controller('HomeController', 
($scope)=>{
    $scope.screens = screens;

    $scope.state = {};

    $scope.state.screen = screens.selectedCountry;

    // TODO: auto-detect country
    $scope.state.selectedCountry = 'United States';

    $scope.countries = countries;

    $scope.todo = () => alert('TODO');
});