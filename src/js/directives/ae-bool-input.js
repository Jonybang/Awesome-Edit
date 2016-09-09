angular
    .module('a-edit')
    .directive('aeBoolInput', ['$timeout', '$filter', function($timeout, $filter) {
        return {
            restrict: 'E',
            templateUrl: 'a-edit-bool-input.html',
            scope: {
                //require
                ngModel: '=',
                viewMode: '=',
                //callbacks
                ngChange: '&',
                onSave: '&',
                //sub
                name: '@'
            },
            link: function (scope, element) {

                scope.$watch('ngModel', function(ngModel){
                    scope.fakeModel = ngModel == 1;
                });

                scope.change = function(){
                    scope.ngModel =  scope.fakeModel;

                    if(scope.ngChange)
                        $timeout(scope.ngChange);
                };
            }
        };
    }]);