angular
    .module('a-edit')
    .directive('aeSorting', ['$timeout', 'AppPaths', function($timeout, AppPaths) {
        return {
            restrict: 'E',
            templateUrl: 'ae-sorting.html',
            transclude: true,
            scope: {
                ngModel: '=',
                name: '@',
                ngChange: '&'
            },
            link: function (scope, element, attrs) {
                scope.sort = function(){
                    if(!scope.ngModel){
                        scope.ngModel = 'ASC';
                    } else if(scope.ngModel == 'ASC'){
                        scope.ngModel = 'DESC';
                    } else if(scope.ngModel == 'DESC'){
                        scope.ngModel = '';
                    }

                    $timeout(scope.ngChange);
                }
            }
        };
    }]);