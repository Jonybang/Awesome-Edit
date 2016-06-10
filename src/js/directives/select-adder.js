angular.module('a-edit').directive('selectAdder', [function() {
    return {
        restrict: 'C',
        link: function ($scope, $element, $attrs){
            $element.click(function($event){
                var $element = angular.element($event.target);
                if(!$element.hasClass('btn'))
                    $event.stopPropagation();

                if($element.hasClass('btn-default'))
                    $event.stopPropagation();
            });
        }
    };
}]);