function MainViewModel() {
    var self = this;

    self.crashGroupsData = ko.observableArray();
    self.crashReportsData = ko.observableArray();
    self.crashSolutionsData = ko.observableArray();


    //load all crash groups
    $.ajax(Repository.CrashReports.all())
        .done(function (response) {
            var cgPromises = Enumerable.From(response)
                .Select(
                    function (crash) {
                        return crash.crash_report.crash_group_id;

                    })
                .Distinct()
                .Select(function (id) {
                    return $.ajax(crashGroups.get(id));
                })
                .ToArray();

            Promise.all(cgPromises)
                .then(function (responses) {
                    ko.utils.arrayForEach(responses, function (response) {
                        self.crashGroupsData.push(new GroupVM(response, self));
                    });
                });
        });


    //load all crash reports
    $.ajax(Repository.CrashReports.all()).done(function (response) {
        var reports = Enumerable.From(response)
            .Select(
                function (crash) {
                    return new CrashVM(crash.crash_report, self);
                }
            )
            .ToArray();
        ko.utils.arrayPushAll(self.crashReportsData, reports);
    });

    //load all solutions
    $.ajax(Repository.Solutions.all()).done(function (response) {
        var soluions = Enumerable.From(response)
            .Select(
                function (solution) {
                    return new SolutionVM(solution.solution, self);
                }
            )
            .ToArray();
        ko.utils.arrayPushAll(self.crashSolutionsData, soluions);

    });







    //    self.selectedCrashGroup = ko.observable();
    //
    //    self.assignReport = function (report) {
    //        var crashGroups = Enumerable.From(Repository.CrashGroups);
    //        self.selectedId = self.selectedCrashGroup();
    //        self.crashGroupUrl = crashGroups.First(function (crashGroup) {
    //            return crashGroup.crash_group_id == self.selectedId
    //        })["crash_group_url"];
    //
    //        $.ajax({
    //            url: "http://private-anon-71b931be7-dpcs.apiary-mock.com/vd1/crash-reports/" + report.id,
    //            type: "GET",
    //        })
    //            .done(function (response) {
    //                response["crash_report"]["crash_group_id"] = self.selectedId
    //                response["crash_report"]["crash_group_url"] = self.crashGroupUrl
    //                $.ajax({
    //                    url: "http://private-anon-71b931be7-dpcs.apiary-mock.com/vd1/crash-reports/" + report.id,
    //                    type: "PUT",
    //                    data: {
    //                        "crash_report": response
    //                    }
    //                })
    //                    .done(function (response, textStatus, jqXHR) {
    //                        if (jqXHR.status == 200) {
    //                            self.crashReportsData.remove(report)
    //                        }
    //                    });
    //            });
    //    }
    //
        self.CrashToAdd = ko.observable(new CrashVM({}, self));
    
        self.AddCrash = function () {
            self.CrashToAdd(new CrashVM({}, self));
            $('#add-crash-modal').modal('show');
        }
    
        self.SendCrash = function () {
    
            var crashReport = {
                "application": {
                    "name": self.CrashToAdd().Application().Name(),
                    "version": self.CrashToAdd().Application().Version()
                },
                "system_info": {
                    "version": self.CrashToAdd().SystemInfo().Version()
                },
                "exit_code": self.CrashToAdd().ExitCode(),
                "stderr_output": self.CrashToAdd().StderrOutput()
            };
    
            $.ajax({
                url: "http://private-anon-71b931be7-dpcs.apiary-mock.com/vd1/crash-reports/",
                type: "POST",
                data: {
                    "crash_report": crashReport
                }
            })
                .done(function (response) {
                    var data = $.extend(crashReport, response.crash_report_ack);
                    self.crashReportsData.push(new CrashVM(data, self));
                    $('#add-crash-modal').modal('hide');
                });
        }
    
    //    self.SendCrashGroup = function () {
    //
    //        var crashGroup = {
    //
    //        };
    //
    //        $.ajax({
    //            url: "http://private-anon-7dff37ec3-dpcs.apiary-mock.com/vd1/crash-groups",
    //            type: "PUT"
    //        })
    //            .done(function (response) {
    //                var data = response;
    //                var g = new GroupVM(data, self);
    //                self.crashGroupsData.push(g);
    //            });
    //    }
    //
        self.GroupToView = ko.observable(new GroupVM({}, self));
    
        self.ViewCrashGroup = function (group) {
            self.GroupToView(group);
            $('#crash-group-details-modal').modal('show');
        }






    //test data --------------------
        var testGroup = new GroupVM({
            "crash_group_id": 425,
            "crash_group_url": "vd1/crash-groups/425"
        }, self);

        self.crashGroupsData.push(testGroup);

        testGroup = new GroupVM({
            "crash_group_id": 124,
            "crash_group_url": "vd1/crash-groups/124"
        }, self);

        self.crashGroupsData.push(testGroup);

        var testReport = new CrashVM({
            "crash_report_id": 1000,
            "crash_report_url": "vd1/crash-reports/1000",
            "application": {
                "name": "Mozilla firefox",
                "version": "15.0"
            },
            "system_info": {
                "version": "14.04.1 LTS"
            },
            "exit_code": 1,
            "stderr_output": "error: fox overflow"
        }, self);

        self.crashReportsData.push(testReport);
}


function GroupVM(data, root) {
    var self = this;

    //property
    self.GroupId = ko.observable(data.crash_group_id || "");
    self.GroupUrl = ko.observable(data.crash_group_url || "");


    //computed
    self.Crashes = ko.computed(function () {
        return Enumerable.From(root.crashReportsData())
            .Where(function (crash) {
                return crash.GroupId() === self.GroupId();
            })
            .ToArray();

    });

    self.Solution = ko.computed(function () {
        return ko.utils.arrayFirst(root.crashSolutionsData(), function (solution) {
            return solution.GroupId() === self.GroupId();
        });
    });

    self.SolutionName = ko.pureComputed(function () {
        return self.Solution() ? self.Solution().ShellScript() : "no solution";
    });

    self.Count = ko.pureComputed(function () {
        return self.Crashes().length;
    });



}


function SolutionVM(data, root) {
    var self = this;

    self.SolutionId = ko.observable((data.solution_id) ? data.solution_id : "");
    self.SolutionUrl = ko.observable(data.crash_report_url || "");
    self.GroupId = ko.observable(data.crash_group_id || "");
    self.GroupUrl = ko.observable(data.crash_group_url || "");
    self.ShellScript = ko.observable(data.shell_script || "");

    //computed
    self.Group = ko.computed(function () {
        return ko.utils.arrayFirst(root.crashGroupsData(), function (group) {
            return group.GroupId() === self.GroupId();
        });
    });


}

function CrashVM(data, root) {
    var self = this;

    self.ReportId = ko.observable(data.crash_report_id || "");
    self.ReportUrl = ko.observable(data.crash_report_url || "");
    self.GroupId = ko.observable(data.crash_group_id || "");
    self.GroupUrl = ko.observable(data.crash_group_url || "");
    self.ExitCode = ko.observable(data.exit_code || "");
    self.StderrOutput = ko.observable(data.stderr_output || "");

    self.Application = ko.observable({
        Name: ko.observable((data.application && data.application.name) || ""),
        Version: ko.observable((data.application && data.application.version) || "")
    });
    self.SystemInfo = ko.observable({
        Version: ko.observable((data.system_info && data.system_info.version) || "")
    });

    //computed
    self.Group = ko.computed(function () {
        return ko.utils.arrayFirst(root.crashGroupsData(), function (group) {
            return group.GroupId() === self.GroupId();
        });
    });

    //functions
    self.Edit = function () {
        alert("edit1");
    }
}

