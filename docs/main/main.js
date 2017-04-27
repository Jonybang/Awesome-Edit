angular
    .module('app')
    .controller('MainController', ['$scope', '$resource', function($scope, $resource) {

        var CompaniesResource = $resource('/api/companies/:id', {id:'@id'});

        $scope.aeGridOptions = {
            resource: CompaniesResource,
            ajax_handler: true,
            get_list: true,
            paginate: true,
            edit: true,
            delete: true,
            fields: [
                {
                    name: 'name',
                    label: 'Name',
                    modal: 'self',
                    colspan: 2,
                    new_placeholder: 'New company'
                },
                {
                    name: 'country_id',
                    label: 'Country',
                    type: 'select',
                    resource: $resource('/api/countries/:id', {id:'@id'}),
                    get_list: true
                },
                {
                    name: 'directions_ids',
                    label: 'Directions',
                    type: 'multiselect',
                    resource: $resource('/api/directions/:id', {id:'@id'}),
                    get_list: true
                }
            ]
        };
    }]);