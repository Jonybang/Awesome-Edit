angular
    .module('a-edit')

    .directive('aeSelectInput', ['$timeout', '$compile', '$templateCache', 'AEditHelpers' ,'AEditConfig', function($timeout, $compile, $templateCache, AEditHelpers, AEditConfig) {
        function getTemplateByType(type, options){
            options = options || {};

            var mdSelect = {
                //attributes: '',
                //match: 'selectedName',
                //itemId: 'item.id',
                itemName: '(item[$parent.nameField] || item.name || item[$parent.orNameField])',
                //subClasses: ''
            };

            return '' +
            '<md-autocomplete ' +
                'md-search-text="options.search" ' +
                'md-items="item in getListByResource(options.search)" ' +
                'ng-disabled="ngDisabled" ' +
                'md-selected-item="options.selected" ' +
                'md-search-text-change="getListByResource(options.search)" ' +
                'md-selected-item-change="selectedItemChange(item)" ' +
                'md-item-text="' + mdSelect.itemName + '" ' +
                'md-min-length="0" ' +
                'placeholder="{{placeholder}}"> ' +
                    '<md-item-template> ' +
                        '<span md-highlight-text="options.search" md-highlight-flags="^i">{{' + mdSelect.itemName + '}}</span> ' +
                    '</md-item-template>' +
                    '<md-not-found>' +
                        'No items matching "{{options.search}}" were found.' +
                        '<a ng-click="newItem(options.search)">Create a new one!</a>' +
                    '</md-not-found>' +
            '</md-autocomplete>';

            if(type == 'multiselect'){
                uiSelect.attributes = 'multiple close-on-select="false"';
                uiSelect.match = '$item[$parent.nameField] || $item.name || $item[$parent.orNameField]';
            }
            if(type == 'textselect'){
                uiSelect.itemId = '';
                uiSelect.itemName = 'item';
            }
            if(options.adder){
                uiSelect.subClasses = 'btn-group select-adder';
            }

            var template = '' +
                '<div class="select-input-container ' + uiSelect.subClasses + ' {{input_class}}">' +
                '<span ng-if="!isEdit">{{selectedName}}</span>' +
                '<input type="hidden" name="{{name}}" ng-bind="ngModel" class="form-control" required />' +

                '<div ng-if="isEdit">' +
                '<ui-select ' + uiSelect.attributes + ' ng-model="options.value" ng-click="changer()" class="input-small" reset-search-input="{{resetSearchInput}}" on-select="onSelectItem($select)">' +
                '<ui-select-match placeholder="">' +
                '<a class="close clear-btn" ng-click="clearInput($event)"><span>×</span></a>' +
                '{{' + uiSelect.match + '}}' +
                '</ui-select-match>' +

                '<ui-select-choices refresh="getListByResource($select.search)" refresh-delay="{{refreshDelay}}" repeat="' + (uiSelect.itemId ? uiSelect.itemId + ' as ' : '') + 'item in $parent.local_list | filter: $select.search track by $index">' +
                '<div ng-bind-html="' + uiSelect.itemName + ' | highlight: $select.search"></div>' +
                '</ui-select-choices>' +
                '</ui-select>';

            if(options.adder){
                template += '' +
                    '<button type="button" class="btn btn-success" ng-click="popover.is_open = true"' +
                    ' uib-popover-template="popover.template_name"' +
                    ' uib-popover-title="Add object"' +
                    ' popover-placement="top"' +
                    ' popover-append-to-body="true"' +
                    ' popover-is-open="popover.is_open"' +
                    ' popover-trigger="none">' +
                    '<span class="glyphicon glyphicon-plus"></span>' +
                    '</button>';
            }

            template +=
                '</div>' +
                '</div>';
            return template;
        }

        var typeTemplates = {
            'select': $compile(getTemplateByType('')),
            'select-adder': $compile(getTemplateByType('', {adder: true})),
            'textselect': $compile(getTemplateByType('textselect')),
            'textselect-adder': $compile(getTemplateByType('textselect', {adder: true})),
            'multiselect': $compile(getTemplateByType('multiselect')),
            'multiselect-adder': $compile(getTemplateByType('multiselect', {adder: true}))
        };

        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                //require
                list: '=?',
                ngModel: '=',
                ngModelStr: '=?',
                isEdit: '=?',
                hasError: '=?',

                ngResource: '=?',
                ngResourceFields: '=?',

                refreshListOn: '=?',

                //callbacks
                ngChange: '&',
                onSave: '&',
                onSelect: '&',
                //sub
                adder: '=?',
                getList: '=?',
                nameField: '@',
                orNameField: '@',
                placeholder: '@',
                name: '@',
                type: '@' //select or multiselect
            },
            link: function (scope, element, attrs, ngModel) {
                //=============================================================
                // Config
                //=============================================================
                var variables = angular.extend({}, AEditConfig.grid_options.request_variables, AEditConfig.grid_options.response_variables);

                scope.refreshDelay = AEditConfig.select_options.refresh_delay;
                scope.resetSearchInput = AEditConfig.select_options.reset_search_input;

                scope.options = {
                    selected: null,
                    search: ''
                };

                scope.full_type = scope.type = scope.type || 'select';
                if(scope.adder)
                    scope.full_type += '-adder';

                scope.fakeModel = scope.ngModel;

                //=============================================================
                // Compile
                //=============================================================

                typeTemplates[scope.type](scope, function (clonedElement, scope) {
                    element.empty();
                    element.append(clonedElement);
                });

                //=============================================================
                // Output validation
                //=============================================================
                //scope.$watch('hasError', function(hasError){
                //    scope.input_class = hasError ? "has-error" : '';
                //});

                //=============================================================
                // Callbacks
                //=============================================================
                scope.selectedItemChange = function(selected){
                    $timeout(scope.onSelect);
                    $timeout(scope.ngChange);

                    if(scope.type == 'mutiselect'){
                        scope.fakeModel = selected ? selected.map(function(item){return item.id;}) : [];
                    } else if(scope.type == 'select')  {
                        scope.fakeModel = selected ? selected.id : null;
                    }

                    scope.ngModel = scope.fakeModel;
                };

                scope.$watch('ngModel', function(newVal){
                    if(scope.fakeModel == newVal)
                        return;

                    scope.fakeModel = newVal;

                    scope.setSelected();
                    scope.setSelectedName(newVal);
                });

                //TODO: optimize
                scope.$watch(function() {
                    return ngModel.$viewValue;
                }, function(newVal) {
                    scope.ngModel = newVal;
                    scope.setSelectedName(newVal);
                });

                //=============================================================
                // Init select list
                //=============================================================
                function initListGetByResource(){
                    if(!scope.ngResource || !scope.getList || (scope.local_list && scope.local_list.length))
                        return;

                    scope.getListByResource();
                }
                scope.getListByResource = function (query){
                    if(!scope.ngResource)
                        return;

                    var request_options = {};
                    if(query)
                        request_options[variables['query']] = query;

                    request_options[variables['limit']] = AEditConfig.select_options.items_per_page;

                    return AEditHelpers.getResourceQuery(scope.ngResource, 'get', request_options).then(function(list){
                        scope.local_list = list;
                        scope.setSelectedName(scope.ngModel);
                        return list;
                    });
                };

                scope.$watch('ngResource', initListGetByResource);
                scope.$watch('refreshListOn', initListGetByResource);

                //=============================================================
                // Output non edit mode
                //=============================================================
                scope.$watch('list', function(list){
                    scope.local_list = angular.copy(list);
                    scope.setSelectedName(scope.ngModel);
                });
                scope.setSelected = function(){
                    if(!scope.local_list || !scope.local_list.length)
                        return;

                    if(scope.type == 'mutiselect' && scope.fakeModel.length){
                        scope.fakeModel = selected ? selected.map(function(item){return item.id;}) : [];
                    } else if(scope.type == 'select')  {
                        scope.fakeModel = selected ? selected.id : null;
                    }
                };
                scope.setSelectedName = function (newVal){
                    if(!scope.local_list || !scope.local_list.length)
                        return;

                    if(scope.type == 'textselect'){
                        scope.selectedName = newVal ? newVal : '';
                        return;
                    }

                    if(Array.isArray(newVal)){
                        // if ngModel - array of ids
                        var names = [];
                        newVal.forEach(function(id){
                            // get from current list by id
                            var result_name = AEditHelpers.getNameById(scope.local_list, id, scope.nameField, scope.orNameField);
                            if(result_name){
                                names.push(result_name);
                            } else if(scope.ngResource){
                                // if object with id not exist in current list - get from server
                                getObjectFromServer(id).then(function(object){
                                    names.push(getNameFromObj(object));
                                    scope.selectedName = names.join(', ');
                                    scope.ngModelStr = scope.selectedName;
                                    scope.local_list.push(object)
                                })
                            }
                        });
                        scope.selectedName = names.join(', ');
                    } else {
                        // get from current list by id
                        scope.selectedName = AEditHelpers.getNameById(scope.local_list, newVal, scope.nameField, scope.orNameField);

                        // if object with id not exist in current list - get from server
                        if(!scope.selectedName && newVal && scope.ngResource){
                            getObjectFromServer(newVal).then(function(object){
                                scope.selectedName = getNameFromObj(object);
                                scope.ngModelStr = scope.selectedName;
                                scope.local_list.push(object);
                            })
                        }
                    }
                    scope.ngModelStr = scope.selectedName;
                };

                function getObjectFromServer(id){
                    return AEditHelpers.getResourceQuery(scope.ngResource, 'show', {id: id});
                }
                function getNameFromObj(obj){
                    return obj[scope.nameField] || obj.name || obj[scope.orNameField];
                }

                //=============================================================
                // Compile Adder button
                //=============================================================
                if(scope.adder){
                    scope.new_object = {};

                    var popoverTemplate = '' +
                        '<div ng-click="popoverContentClick($event)">';

                    if(scope.type == 'textselect' && !scope.ngResourceFields)
                        scope.ngResourceFields = [{name: 'name', label: ''}];

                    scope.ngResourceFields.forEach(function(field){
                        popoverTemplate += '' +
                            '<div class="form-group col-md-12 row">' +
                            '<div>' +
                            '<label>' + field.label + '</label>' +
                            '</div>' +
                            '<div>' +
                            AEditHelpers.generateDirectiveByConfig(field, {
                                item_name: '$parent.new_object',
                                lists_container: 'lists',
                                always_edit: true,
                                is_new: true
                                //already_modal: true
                            }) +
                            '</div>' +
                            '</div>';

                        if(field.resource){
                            scope[field.name + '_resource'] = field.resource;
                        }

                        if(field.type == 'multiselect'){
                            scope.new_object[field.name] = [];
                        }
                    });

                    popoverTemplate += '' +
                        '<div class="form-group col-md-12 row">' +
                        '<button type="submit" class="btn btn-primary" ng-click="$parent.saveToList(new_object);">Save</button>' +
                        '<button class="btn btn-danger pull-right" ng-click="$parent.popover.is_open = false">Close</button>' +
                        '</div>' +
                        '</div>';

                    scope.popover = {
                        is_open: false,
                        template_name: attrs.ngModel + '-' + attrs.ngResource + '.html'
                    };
                    $templateCache.put(scope.popover.template_name, popoverTemplate);
                }

                //=============================================================
                // Add new item to select list by adder
                //=============================================================
                scope.saveToList = function(new_object){
                    scope.popover.is_open = false;

                    if(scope.type == 'textselect'){
                        //get first property of object and add it to list
                        var is_first_prop = true;
                        angular.forEach(new_object, function(prop_value){
                            if(is_first_prop){
                                scope.local_list.unshift(prop_value);
                                scope.ngModel = prop_value;
                            }
                            is_first_prop = false;
                        });
                        return;
                    }

                    AEditHelpers.getResourceQuery(new scope.ngResource(new_object), 'create').then(function(object){
                        scope.local_list.unshift(object);

                        if(angular.isArray(scope.ngModel))
                            scope.ngModel.push(object.id);
                        else
                            scope.ngModel = object.id;
                    });
                }
            }
        };
    }]);