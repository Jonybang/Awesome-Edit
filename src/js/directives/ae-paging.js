angular
    .module('a-edit')
    .directive('aePaging', ['AppPaths', function(AppPaths) {
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
                })
            }
        };
    }]);