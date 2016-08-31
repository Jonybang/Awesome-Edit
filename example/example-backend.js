angular.module('example-backend', ['ngMockE2E', 'helpers']).run(['$httpBackend', 'Helpers', function($httpBackend, Helpers) {

    var items = [
      {id: 1, name: 'Теват', date: new Date('2016-02-01'), type_id: 3, types_ids: [6,3]},
      {id: 2, name: 'Бизнес инкубатор', date: new Date('2016-02-02'), type_id: 2, types_ids: [5]},
      {id: 3, name: 'Инженерная школа', date: new Date('2016-02-03'), type_id: 4, types_ids: [2]}
    ];
    
    var counter = items.length;
    
    $httpBackend.whenGET('/api/items').respond(function(method, url, data, headers) {
      console.log("Getting items", items);
      
      return [200, items, {}];
    });
    
    function createOrUpdate(method, url, data, headers){
      
      var newItem = angular.fromJson(data);
      
      var existItem = Helpers.findById(items, newItem.id);
      if(existItem){
        newItem = angular.extend(existItem, newItem);
        console.log('Update item:', newItem);
      }
      else{
        newItem.id = ++counter;
        items.push(newItem);
        console.log('Create item:', newItem);
      }
      
      return [200, newItem, {}];
    };
    
    $httpBackend.whenPOST('/api/items').respond(createOrUpdate);
    $httpBackend.whenPOST(/\api\/items\/*/).respond(createOrUpdate);
    
    $httpBackend.whenDELETE(/\api\/items\/*/).respond(function(method, url, data, headers) {
      var id = url.split("/").slice(-1)[0]; 
      
      console.log("Delete item by id", id);
      
      Helpers.deleteById (items, id);
      return [200, {}, {}];
    });
    
    $httpBackend.whenGET(/.html/).passThrough()

}]);


