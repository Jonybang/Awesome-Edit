angular
    .module('a-edit')
    .directive('aePaging', ['AppPaths', '$timeout', function(AppPaths, $timeout) {
        return {
            restrict: 'E',
            templateUrl: 'a-edit-paging.html',
            scope: {
                ngModel: '=',
                ngChange: '&',
                totalItems: '='
            },
            link: function (scope, element) {
                scope.$watch('ngModel.total_items', function(totalItems){
                    scope.ngModel.total_pages = Math.ceil(parseInt(totalItems) / scope.ngModel.per_page);
                });
                var isFirstChange = true;
                scope.pagingChanged = function(){
                    if(isFirstChange){
                        isFirstChange = false;
                        return;
                    }
                    console.log('pagingChanged');
                    $timeout(scope.ngChange);
                }
            }
        };
    }]);