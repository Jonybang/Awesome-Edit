angular
    .module('backend', ['ngMockE2E'])
    .run(['$httpBackend', function($httpBackend) {

        var companies = [
            {id: 1, name: 'Google', country_id: 2, directions_ids: [1,2]},
            {id: 2, name: 'Yandex', country_id: 1, directions_ids: [1,2]},
            {id: 3, name: 'Synergy', country_id: 1, directions_ids: [3]}
        ];

        $httpBackend.whenGET(/\/api\/companies\D{3,}/).respond(getList(companies));
        $httpBackend.whenGET(/\/api\/companies\/\d+/).respond(getById(companies));
        $httpBackend.whenPOST('/api/companies').respond(createOrUpdate(companies));
        $httpBackend.whenPOST(/\/api\/companies\/*/).respond(createOrUpdate(companies));
        $httpBackend.whenDELETE(/\/api\/companies\/*/).respond(deleteById(companies));

        var countries = [
            {id: 1, name: 'Russia'},
            {id: 2, name: 'USA'},
            {id: 3, name: 'China'}
        ];

        $httpBackend.whenGET(/\/api\/countries\D{3,}/).respond(getList(countries));
        $httpBackend.whenGET(/\/api\/countries\/\d+/).respond(getById(countries));
        $httpBackend.whenPOST('/api/countries').respond(createOrUpdate(countries));
        $httpBackend.whenPOST(/\/api\/countries\/*/).respond(createOrUpdate(countries));
        $httpBackend.whenDELETE(/\/api\/countries\/*/).respond(deleteById(countries));

        var directions = [
            {id: 1, name: 'Search'},
            {id: 2, name: 'Research'},
            {id: 3, name: 'Develop'}
        ];

        $httpBackend.whenGET(/\/api\/directions\D{3,}/).respond(getList(directions));
        $httpBackend.whenGET(/\/api\/directions\/\d+/).respond(getById(directions));
        $httpBackend.whenPOST('/api/directions').respond(createOrUpdate(directions));
        $httpBackend.whenPOST(/\/api\/directions\/*/).respond(createOrUpdate(directions));
        $httpBackend.whenDELETE(/\/api\/directions\/*/).respond(deleteById(directions));

        $httpBackend.whenGET(/.html/).passThrough()

    }]);

function getList(items) {
    return function(method, url, data, headers) {
        var result_list = items;

        var search = getParameterByName('_q', url);

        if(search)
            result_list = result_list.filter(function(item){
                return item.name.toLowerCase().indexOf(search.toLowerCase()) != -1;
            });

        return [200, result_list, {}];
    }
}
function getById(items) {
    return function(method, url, data, headers) {
        var id = url.split("/").slice(-1)[0];
        var result = _.find(items, {id: parseInt(id)});

        return [200, result, {}];
    }
}

function createOrUpdate(items) {
    var counter = items.length;

    return function (method, url, data, headers) {
        var newItem = angular.fromJson(data);

        var foundItem = _.find(items, {id: newItem.id});
        if (foundItem) {
            _.extend(foundItem, newItem);
            console.log('Update item:', newItem);
        } else {
            newItem.id = ++counter;
            items.push(newItem);
            console.log('Create item:', newItem);
        }
        return [200, newItem, {}];
    };
}

function deleteById(items) {
    return function (method, url, data, headers) {
        var id = url.split("/").slice(-1)[0];

        console.log("Delete item by id", id);

        _.remove(items, {id: id});
        return [200, {}, {}];
    };
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}