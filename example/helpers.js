angular.module('helpers', [])
  .factory('Helpers', [function () {
      var service = {
        findById: function (array, id, func){
            var resultObject;
            array.some(function(obj){
                var result = obj.id == id;
                if(result)
                    resultObject = obj;
                return result;
            });
        
            if(func && resultObject)
                func(resultObject);
        
            return resultObject;
        },
        
      deleteById: function (array, id, func){
          if(!array || !array.length)
              return false;
          
          var index = -1;
          array.some(function(obj, idx){
              var result = obj == id || obj.id == id;
              if(result)
                  index = idx;
              return result;
          });
      
          if(index != -1){
              array.splice(index, 1);
              return true;
          } else {
              return false;
          }
      }
    }
    
    return service;
  }]);

