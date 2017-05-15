/**
 * Created by jonybang on 04.07.15.
 */
angular.module('a-edit')
    .factory('AEditHelpers', [function() {
        var service = {
            //config:
            //  html_attributes
            //  lists_container
            //  list_variable
            //  item_name
            //  field_name
            //  always_edit
            generateDirectiveByConfig: function(field, config, object){
                var output = '';
                var directive = '';

                if(!config)
                    config = {};

                switch(field.type){
                    case 'select':
                    case 'textselect':
                    case 'multiselect':
                        directive = 'select-input';
                        break;
                    case 'date':
                        directive = 'date-input';
                        break;
                    case 'bool':
                        directive = 'bool-input';
                        break;
                    case 'file':
                    case 'multifile':
                        directive = 'file-upload';
                        break;
                    default:
                        directive = 'text-input';
                        break;
                }

                if(field.directive)
                    directive = field.directive;
                else
                    directive = 'ae-' + directive;

                output += '<' + directive + ' ';

                output += 'type="' + (field.type || '') + '" ' +
                    'name="' + (field.input_name || config.input_name || '') + '" ';

                //if(field.width)
                 //   output += 'width="' + field.width + '" ';

                if(field.required)
                    output += 'ng-required="true" ';

                if('get_list' in config)
                    output += 'get-list="' + config.get_list + '" ';

                if(field.url)
                    output += 'url="' + field.url + '" ';

                if(field.resource)
                    output += 'ng-resource="' + field.name + '_resource" ';

                if(field.fields)
                    output += 'ng-resource-fields="' + field.name + '_fields" ';

                if(field.config)
                    output += 'config="' + config.config_variable + '" ';

                if(config.list_variable)
                    output += 'list="' + config.list_variable + '" ';
                else if(config.lists_container)
                    output += 'list="' + config.lists_container + '.' + field.list + '" ';

                var item_name = angular.isUndefined(config.item_name) ? 'item' : config.item_name;
                var field_name = angular.isUndefined(config.field_name) ? field.name : config.field_name;
                var item_field = item_name + (field.name != 'self' ? '.' : '') + field_name;

                var is_edit;
                if(field.readonly || config.readonly)
                    is_edit = 'false';
                else if(config.always_edit)
                    is_edit = 'true';
                else
                    is_edit = item_name + '.is_edit';
                    
                output += 'ng-model="' + item_field + '" ' +
                    'on-save="save(' + item_name + ')" ' +
                    'on-add="save({' + field_name + ': addNgModel, is_new: true})" ' +
                    'has-error="' + item_name + '.errors.' + field_name + '" ' +
                    'ng-model-str="' + item_name + '.' +  field_name + '_str" ' +
                    'ng-model-sub-str="' + item_name + '.' +  field_name + '_sub_str" ' +
                    (config.no_label ? '' : 'label="' + field.label + '" ' )+
                    'view-mode="!' + is_edit + '" '+
                    'is-new="' + (config.is_new ? 'true': 'false') + '" '+
                    'ng-class="{\'edit\':' + (config.is_new ? 'true': is_edit) + '}" '+
                    'placeholder="' + ((config.always_edit ? field.new_placeholder : field.placeholder) || '') + '" ';

                if(field.default_value){
                    if(angular.isFunction(field.default_value))
                        field.default_value = field.default_value(object);

                    output += 'default-value="' + field.default_value + '" ';
                }
                if(directive == 'ae-file-upload')
                    output += 'uploader="' + item_name + '.' + field_name + '__uploader" ';

                if(directive == 'ae-select-input'){
                    output += 'name-field="' + (field.name_field || '') + '" ';
                    output += 'or-name-field="' + (field.or_name_field || '') + '" ';
                    output += 'adder="' + (field.adder || 'false') + '" ';
                }

                if(field.modal && !config.already_modal && field.modal == 'self'){
                    output += 'modal-object="' + item_name + '" ';
                    output += 'modal-options="actualOptions" ';
                }

                output += '></' + directive + '>';

                return output;
            },
            getResourceQuery: function(obj, action, options){
                options = options || {};
                
                var possibleFunctions;
                switch(action){
                    case 'search':
                        possibleFunctions = ['get'];
                        break;
                    case 'get':
                        possibleFunctions = ['query', 'get'];
                        break;
                    case 'show':
                        possibleFunctions = ['$get', 'get'];
                        break;
                    case 'create':
                        possibleFunctions = ['$save', 'create'];
                        break;
                    case 'update':
                        possibleFunctions = ['$update', 'update', '$save'];
                        break;
                    case 'delete':
                        possibleFunctions = ['$delete', 'delete'];
                        break;
                }
                
                var query;
                possibleFunctions.some(function(functionName){
                    if(obj[functionName])
                        query = obj[functionName](options);
                    
                    return obj[functionName];
                });
                
                if(!query){
                    console.error('Undefined model resource! Override getResourceQuery function in AEditHelpers service for define custom resource function.')
                }
                return query.$promise || query;
            },
            isEmptyObject: function(obj) {
                for(var prop in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                        return false;
                    }
                }
                return true;
            },
            getNameById: function(list, val, nameField, orNameField){
                var resultName = '';

                if(!list || !list.length)
                    return resultName;

                list.some(function(obj){
                    var result = obj.id == val;
                    if(result)
                        resultName = obj[nameField] || obj.name || obj[orNameField];
                    return result;
                });
                return resultName;
            },
            round5: function(x){
                return Math.floor(x/5)*5;
            },
            debounce: function(func, wait, immediate) {
                var timeout;
                return function() {
                    var context = this, args = arguments;
                    var later = function() {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            }
        };

        return service;
    }]);
