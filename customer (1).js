'use strict';

angular.module('vkApp')
    .controller('customer', function(
        $scope,
        $rootScope,
        $location,
        $log,
        $modal,
        AllPlants,
        PlantById,
        CreateCustomer,
        AddPlant,
        UserProperties,
        GetOwnerByName
    )  {

    $scope.filterOptions = {
        filterText: "",
        useExternalFilter: false
    }; 
    $scope.pagingOptions = {
        pageSizes: [250, 500, 1000],
        pageSize: 10000,
        currentPage: 1
    };  
    $scope.ownerid = '';
    $scope.totalServerItems = 0;
    $scope.allplants = {};
    $scope.plantId;
    $scope.disableadd = false;
    $scope.roleId;
    $scope.plantdetails = {};
    $scope.gridOptions = {
        data: 'myData',
        filterOptions: $scope.filterOptions,
        groups: ['ownerName'],
        groupsCollapsedByDefault: false,
        headerRowHeight: 35,
        aggregateTemplate: '<div ng-click="row.toggleExpand()" ng-style="rowStyle(row)" class="ngAggregate"> <span class="ngAggregateText">{{row.label}} ({{row.totalChildren()}} {{AggItemsLabel}} {{AggItemsLabel}})</span> <div style="float:right;margin-right:500px;"><button class="btn btn-primary ng-binding" testid="addplant_{{row.label}}" ng-click="addNewPlant(row)"> Add Plant </button></div> </div>',
        headerRowTemplate: '/VKWebApp/partials/repairsheader.html',
        rowTemplate: '<div ng-style="{\'cursor\': row.cursor, \'z-index\': col.zIndex() }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}" ng-cell></div>',
        columnDefs: [{width: "40%", field:'location', displayName:'Name', cellTemplate: '<div class="ngCellText"><a href="#/plant/{{row.entity.id}}">{{row.getProperty(col.field)}}</a></div>'}, {field:'area', displayName:'Area'},   {field:'ownerName', displayName: '', visible: false},{field:'ownerId', displayName: '', visible: false}]
    };
    $scope.addNewPlant = function(row){
        GetOwnerByName.read({   
            'name': row.label
        }, function (data) {
            $scope.ownerid = data.response.result.id;
            window.location =  "#/plant/new?ownerid="+ $scope.ownerid;
        }, function (error) {
            $log.error('Get tasks error ',error);
        });

        
    }

    $("input.search-query").attr('id', 'search-query');
    $("input.search-query").next('button').attr('id', 'search-query-button');

    $scope.getUserProps = function(){
        UserProperties.read({},
        function(response){ 
            $rootScope.user = response;
            $scope.roleId = $rootScope.user.roleId;
            if($scope.roleId == 4){
                $scope.disableadd = true;
                $scope.plantId = response.plantIds[0];
                $scope.getPagedDataAsyncByPlant($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
            }else{
                $scope.getPagedDataAsync({pageSize: $scope.pagingOptions.pageSize, page: $scope.pagingOptions.currentPage});
            }
        });

    };
    $scope.getUserProps();
    $scope.showAddCustomersModal = function(){
        var modalInstance = $modal.open({
            controller: 'addNewCustomer',
            templateUrl: '/VKWebApp/partials/addnewcustomer.html',
            windowClass: 'addnewusermodal',
            backdrop: false,
            scope: $scope
        }); 
        modalInstance.result.then(function (response) {
            $scope.saveCustomer(response);
        }); 
    };
    $scope.saveCustomer = function(response){

        CreateCustomer.create(response, function (json) {
            var output = json.response.status;  
            if (output == "Success") {
                $scope.data = json.response.result;
                $scope.getPagedDataAsync({pageSize: $scope.pagingOptions.pageSize, page: $scope.pagingOptions.currentPage});
             }
        });
    
    }

    $scope.showAddPlantModal = function(){
         window.location =  "#/plant/new";
    };
    $scope.savePlant = function(response){

        AddPlant.create(response, function (json) {
            $scope.data = json;
            $scope.getPagedDataAsync({pageSize: $scope.pagingOptions.pageSize, page: $scope.pagingOptions.currentPage});
        }, function(error){
            $log.error('Add PLANT save error',error);
        });
    
    }
    $scope.setPagingData = function(data, page, pageSize){
        var pagedData = data.slice((page - 1) * pageSize, page * pageSize);
        $scope.myData = pagedData;
        $scope.totalServerItems = data.length;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };
    $scope.setPagingDataByPlantID = function(data){  
        var plantByID = new Array();
        plantByID.push(data);
        $scope.myData = plantByID;
         if (!$scope.$$phase) {
            $scope.$apply();
        }
    };
    $scope.getPagedDataAsync = function (parameters) {
        var pageSize = parameters.pageSize;
        var page = parameters.page;
        setTimeout(function () {
            AllPlants.read(function (jsonData) {
                $scope.allplants = jsonData.response.result;
                $scope.setPagingData(jsonData.response.result,page,pageSize);
            });
        }, 100);
    };
    $scope.getPagedDataAsyncByPlant = function (parameters) {
        var pageSize = parameters.pageSize;
        var page = parameters.page;
        setTimeout(function () {
            PlantById.read({
                Id: $scope.plantId
            },function (jsonData) {
               $scope.setPagingDataByPlantID(jsonData);
            });
        }, 100);
    };
    $scope.getPlantByPlantID = function(plantId){
            PlantById.read({
                Id: plantId
            }, function (response) { 
                $scope.plant =  response;
                $scope.plantdetails = $scope.plant;
            });
       
    }
    $scope.$watch('filterOptions', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.getPagedDataAsync({pageSize: $scope.pagingOptions.pageSize, page: $scope.pagingOptions.currentPage}, $scope.filterOptions.filterText);
        }
    }, true);
   


}).controller('addNewCustomer', function ($scope, $modalInstance) {
    $scope.createCustomer = function (customer) {
        $modalInstance.close(customer);
    };

    $scope.ok = function() {
        $modalInstance.dismiss();
    };
})
.controller('addNewPlant', function ($scope, $modalInstance, AllOwner) {
    $scope.allcustomers = {};
    AllOwner.read({}, function(json){
        $scope.allcustomers = json.response.result;
    });
    $scope.createNewPlant = function (plant) {
        $modalInstance.close(plant);
    };

    $scope.ok = function() {
        $modalInstance.dismiss();
    };
})