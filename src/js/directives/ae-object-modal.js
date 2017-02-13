angular
    .module('a-edit')

    .directive('aeObjectModal', ['$timeout', '$log', '$cacheFactory', 'AEditHelpers', 'AEditConfig', '$mdDialog', function($timeout, $log, $cacheFactory, AEditHelpers, AEditConfig, $mdDialog) {
        var cache = $cacheFactory('aModal.Templates');

        return {
            restrict: 'A',
            scope: {
                //require
                aeObjectModal: '=',
                modalResourceOptions: '=?',
                viewMode: '=?',
                //callbacks
                onSave: '&'
            },
            link: function (scope, element, attrs) {

                var resource_name = attrs.aeObjectModal + new Date().getTime();
                scope.options = scope.modalResourceOptions || AEditConfig.current_options;

                element.on("click", function () {
                    var template = cache.get(resource_name) || '';
                    //'<button ng-click="cancel()" class="close pull-right"><span>&times;</span></button>' +
                    if(!template){
                        template +=
                            '<md-dialog class="ae-object-modal">' +
                                '<md-toolbar>' +
                                    '<div class="md-toolbar-tools">' +
                                        '<h3>' + AEditConfig.locale.modal + '</h3>' +

                                        '<span flex></span>' +

                                        '<md-button class="md-icon-button" ng-click="object.is_edit = !object.is_edit">' +
                                            '<md-icon>mode_edit</md-icon>' +
                                        '</md-button>' +
                                    '</div>' +
                                '</md-toolbar>' +
                                '<md-dialog-content class="padding">';
                        
                        scope.options.fields.forEach(function(field){
                            template += '<md-content flex="grow" layout>';

                            template += '<div layout="column" layout-align="center" flex="30" style="text-align: right" class="padding"><label>' + field.label + '</label></div>';
                            template += '<div layout="column" layout-align="center" flex="70" class="padding">' + AEditHelpers.generateDirectiveByConfig(field, {
                                item_name: 'object',
                                lists_container: 'lists',
                                already_modal: true,
                                no_label: true
                            }) + '</div>';

                            template += '</md-content>';
                        });
                        
                        template +=
                                '</md-dialog-content>' +
                                '<md-dialog-actions>' +
                                    '<md-button ng-click="ok()" class="md-primary">OK</md-button>' +
                                '</md-dialog-actions>' +
                            '</md-dialog>';
                            
                        cache.put(resource_name, template);
                    }

                    var modalInstance = $mdDialog.show({
                        clickOutsideToClose: true,
                        template: template,
                        locals: {
                            data: {
                                object: angular.copy(scope.aeObjectModal),
                                resource: scope.options.resource,
                                lists: scope.options.lists,
                                viewMode: scope.viewMode
                            }
                        },
                        controller: ['$scope', '$mdDialog', 'data', function($scope, $mdDialog, data) {
                            angular.extend($scope, data);

                            AEditHelpers.getResourceQuery(new scope.options.resource($scope.object), 'show').then(function(object){
                                $scope.object = object;
                                $scope.object.is_edit = data.viewMode;
                            });
                            
                            $scope.ok = function () {
                                $scope.object.is_edit = false;
                                $mdDialog.hide($scope.object);
                            };
                            $scope.cancel = function () {
                                $mdDialog.cancel();
                            };
                        }]
                    });

                    modalInstance.then(function (object) {
                        angular.extend(scope.aeObjectModal, object);
                        
                        if(scope.onSave)
                            $timeout(scope.onSave);
                    }, function () {
                        $log.info('Modal dismissed at: ' + new Date());
                    });
                });

                scope.save = function(){
                    if(scope.onSave)
                        $timeout(scope.onSave);
                }
            }
        };
    }]);
