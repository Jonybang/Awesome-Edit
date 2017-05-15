angular
    .module('a-edit')
    .directive('aePaging', ['$timeout', function($timeout) {
        return {
            restrict: 'E',
            templateUrl: 'a-edit-paging.html',
            scope: {
                ngModel: '=',
                ngChange: '&',
                totalItems: '='
            },
            link: function (scope, element) {
                scope.$watch('ngModel.total_items', onConfigChange);
                scope.$watch('ngModel.per_page', onConfigChange);
                function onConfigChange(){
                    scope.ngModel.total_pages = Math.ceil(parseInt(scope.ngModel.total_items) / scope.ngModel.per_page);
                }
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