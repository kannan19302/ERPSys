import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/di/providers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mocktail/mocktail.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:unerp_mobile/core/storage/cookie_store.dart';
import 'package:unerp_mobile/core/network/api_client.dart';
import 'package:dio/dio.dart';

import 'package:unerp_mobile/core/contracts/paginated.dart';
import 'package:unerp_mobile/core/error/failures.dart';
import 'package:unerp_mobile/core/usecase/result.dart';
import 'package:unerp_mobile/features/auth/presentation/providers/auth_providers.dart';
import 'package:unerp_mobile/features/projects/domain/entities/projects.dart';
import 'package:unerp_mobile/features/projects/domain/repositories/projects_repository.dart';
import 'package:unerp_mobile/features/projects/presentation/providers/projects_providers.dart';

final Project _projectA = Project(
  id: 'prj1',
  name: 'Alpha Project',
  description: 'First project',
  status: 'ACTIVE',
  priority: 'HIGH',
  budget: 50000,
  actualCost: 12000,
  progress: 24,
  createdAt: DateTime(2026, 1, 15),
  updatedAt: DateTime(2026, 6, 1),
);
final Project _projectB = Project(
  id: 'prj2',
  name: 'Beta Project',
  description: 'Second project',
  status: 'PLANNING',
  priority: 'MEDIUM',
  budget: 25000,
  actualCost: 0,
  progress: 0,
  createdAt: DateTime(2026, 3, 10),
  updatedAt: DateTime(2026, 6, 10),
);

final Task _taskA = Task(
  id: 't1',
  projectId: 'prj1',
  title: 'Design phase',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  estimatedHours: 40,
  actualHours: 20,
  createdAt: DateTime(2026, 2, 1),
);
final Task _taskB = Task(
  id: 't2',
  projectId: 'prj1',
  title: 'Implementation',
  status: 'TODO',
  priority: 'HIGH',
  estimatedHours: 120,
  createdAt: DateTime(2026, 2, 15),
);

final Milestone _milestoneA = Milestone(
  id: 'm1',
  projectId: 'prj1',
  title: 'Kick-off',
  dueDate: DateTime(2026, 2, 1),
  status: 'COMPLETED',
  createdAt: DateTime(2026, 1, 20),
);

final Timesheet _timesheetA = Timesheet(
  id: 'ts1',
  projectId: 'prj1',
  projectName: 'Alpha Project',
  employeeId: 'e1',
  employeeName: 'Alice',
  date: DateTime(2026, 6, 15),
  hours: 8,
  status: 'APPROVED',
  createdAt: DateTime(2026, 6, 15),
);

final ProjectBudget _budgetA = ProjectBudget(
  id: 'b1',
  projectId: 'prj1',
  category: 'Labor',
  budgetedAmount: 30000,
  spentAmount: 10000,
  remainingAmount: 20000,
);

final ProjectRisk _riskA = ProjectRisk(
  id: 'r1',
  projectId: 'prj1',
  title: 'Schedule overrun',
  probability: 'MEDIUM',
  impact: 'HIGH',
  status: 'OPEN',
  createdAt: DateTime(2026, 3, 1),
);

final ProjectPortfolio _portfolioA = ProjectPortfolio(
  id: 'pf1',
  name: 'Infrastructure',
  projectCount: 3,
  totalBudget: 150000,
  createdAt: DateTime(2026, 1, 1),
);
final ProjectPortfolio _portfolioB = ProjectPortfolio(
  id: 'pf2',
  name: 'Software',
  projectCount: 5,
  totalBudget: 300000,
  createdAt: DateTime(2026, 1, 15),
);

Paginated<T> _page<T>(List<T> items, {int page = 1, bool hasMore = false}) =>
    Paginated<T>(
      data: items,
      meta: PaginationMeta(
        page: page,
        limit: 25,
        total: hasMore ? items.length + 1 : items.length,
        totalPages: hasMore ? page + 1 : page,
      ),
    );

class FakeProjectsRepository implements ProjectsRepository {
  int deleteCalls = 0;
  int saveCalls = 0;
  Result<void> deleteResult = Result<void>.ok(null);
  Result<Cacheable<Paginated<Project>>> listProjectsResult =
      Result<Cacheable<Paginated<Project>>>.ok(
    Cacheable<Paginated<Project>>(value: _page(<Project>[_projectA, _projectB])),
  );
  Result<Project> saveProjectResult = Result<Project>.ok(_projectA);

  Result<Cacheable<Paginated<Task>>> listTasksResult =
      Result<Cacheable<Paginated<Task>>>.ok(
    Cacheable<Paginated<Task>>(value: _page(<Task>[_taskA, _taskB])),
  );
  Result<Task> saveTaskResult = Result<Task>.ok(_taskA);

  Result<Cacheable<Paginated<Milestone>>> listMilestonesResult =
      Result<Cacheable<Paginated<Milestone>>>.ok(
    Cacheable<Paginated<Milestone>>(value: _page(<Milestone>[_milestoneA])),
  );
  Result<Milestone> saveMilestoneResult = Result<Milestone>.ok(_milestoneA);

  Result<Cacheable<Paginated<Timesheet>>> listTimesheetsResult =
      Result<Cacheable<Paginated<Timesheet>>>.ok(
    Cacheable<Paginated<Timesheet>>(value: _page(<Timesheet>[_timesheetA])),
  );
  Result<Timesheet> saveTimesheetResult = Result<Timesheet>.ok(_timesheetA);

  Result<Cacheable<Paginated<ProjectBudget>>> listProjectBudgetsResult =
      Result<Cacheable<Paginated<ProjectBudget>>>.ok(
    Cacheable<Paginated<ProjectBudget>>(value: _page(<ProjectBudget>[_budgetA])),
  );
  Result<ProjectBudget> saveProjectBudgetResult =
      Result<ProjectBudget>.ok(_budgetA);

  Result<Cacheable<Paginated<ProjectRisk>>> listProjectRisksResult =
      Result<Cacheable<Paginated<ProjectRisk>>>.ok(
    Cacheable<Paginated<ProjectRisk>>(value: _page(<ProjectRisk>[_riskA])),
  );
  Result<ProjectRisk> saveProjectRiskResult =
      Result<ProjectRisk>.ok(_riskA);

  Result<Cacheable<Paginated<ProjectPortfolio>>> listProjectPortfoliosResult =
      Result<Cacheable<Paginated<ProjectPortfolio>>>.ok(
    Cacheable<Paginated<ProjectPortfolio>>(
      value: _page(<ProjectPortfolio>[_portfolioA, _portfolioB]),
    ),
  );
  Result<ProjectPortfolio> saveProjectPortfolioResult =
      Result<ProjectPortfolio>.ok(_portfolioA);

  @override
  Future<Result<Cacheable<Paginated<Project>>>> listProjects(
    ListQuery query,
  ) async =>
      listProjectsResult;

  @override
  Future<Result<Project>> getProject(String id) async =>
      Result<Project>.ok(_projectA);

  @override
  Future<Result<Project>> createProject(Map<String, dynamic> payload) async {
    saveCalls++;
    return saveProjectResult;
  }

  @override
  Future<Result<Project>> updateProject(
    String id,
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveProjectResult;
  }

  @override
  Future<Result<void>> deleteProject(String id) async {
    deleteCalls++;
    return deleteResult;
  }

  @override
  Future<Result<Cacheable<Paginated<Task>>>> listTasks(
    ListQuery query,
  ) async =>
      listTasksResult;

  @override
  Future<Result<Cacheable<Paginated<Task>>>> listProjectTasks(
    String projectId,
    ListQuery query,
  ) async =>
      listTasksResult;

  @override
  Future<Result<Task>> getTask(String id) async =>
      Result<Task>.ok(_taskA);

  @override
  Future<Result<Task>> createTask(Map<String, dynamic> payload) async {
    saveCalls++;
    return saveTaskResult;
  }

  @override
  Future<Result<Task>> updateTask(
    String id,
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveTaskResult;
  }

  @override
  Future<Result<void>> deleteTask(String id) async {
    deleteCalls++;
    return deleteResult;
  }

  @override
  Future<Result<Cacheable<Paginated<Milestone>>>> listMilestones(
    ListQuery query,
  ) async =>
      listMilestonesResult;

  @override
  Future<Result<Cacheable<Paginated<Milestone>>>> listProjectMilestones(
    String projectId,
    ListQuery query,
  ) async =>
      listMilestonesResult;

  @override
  Future<Result<Milestone>> getMilestone(String id) async =>
      Result<Milestone>.ok(_milestoneA);

  @override
  Future<Result<Milestone>> createMilestone(
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveMilestoneResult;
  }

  @override
  Future<Result<Milestone>> updateMilestone(
    String id,
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveMilestoneResult;
  }

  @override
  Future<Result<void>> deleteMilestone(String id) async {
    deleteCalls++;
    return deleteResult;
  }

  @override
  Future<Result<Cacheable<Paginated<Timesheet>>>> listTimesheets(
    ListQuery query,
  ) async =>
      listTimesheetsResult;

  @override
  Future<Result<Timesheet>> getTimesheet(String id) async =>
      Result<Timesheet>.ok(_timesheetA);

  @override
  Future<Result<Timesheet>> createTimesheet(
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveTimesheetResult;
  }

  @override
  Future<Result<Timesheet>> updateTimesheet(
    String id,
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveTimesheetResult;
  }

  @override
  Future<Result<void>> deleteTimesheet(String id) async {
    deleteCalls++;
    return deleteResult;
  }

  @override
  Future<Result<Timesheet>> approveTimesheet(String id) async =>
      Result<Timesheet>.ok(_timesheetA);

  @override
  Future<Result<Cacheable<Paginated<ProjectBudget>>>> listProjectBudgets(
    String projectId,
  ) async =>
      listProjectBudgetsResult;

  @override
  Future<Result<ProjectBudget>> getProjectBudget(String id) async =>
      Result<ProjectBudget>.ok(_budgetA);

  @override
  Future<Result<ProjectBudget>> createProjectBudget(
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveProjectBudgetResult;
  }

  @override
  Future<Result<ProjectBudget>> updateProjectBudget(
    String id,
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveProjectBudgetResult;
  }

  @override
  Future<Result<void>> deleteProjectBudget(String id) async {
    deleteCalls++;
    return deleteResult;
  }

  @override
  Future<Result<Cacheable<Paginated<ProjectRisk>>>> listProjectRisks(
    String projectId,
  ) async =>
      listProjectRisksResult;

  @override
  Future<Result<ProjectRisk>> getProjectRisk(String id) async =>
      Result<ProjectRisk>.ok(_riskA);

  @override
  Future<Result<ProjectRisk>> createProjectRisk(
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveProjectRiskResult;
  }

  @override
  Future<Result<ProjectRisk>> updateProjectRisk(
    String id,
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveProjectRiskResult;
  }

  @override
  Future<Result<void>> deleteProjectRisk(String id) async {
    deleteCalls++;
    return deleteResult;
  }

  @override
  Future<Result<Cacheable<Paginated<ProjectPortfolio>>>>
      listProjectPortfolios(ListQuery query) async =>
          listProjectPortfoliosResult;

  @override
  Future<Result<ProjectPortfolio>> getProjectPortfolio(String id) async =>
      Result<ProjectPortfolio>.ok(_portfolioA);

  @override
  Future<Result<ProjectPortfolio>> createProjectPortfolio(
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveProjectPortfolioResult;
  }

  @override
  Future<Result<ProjectPortfolio>> updateProjectPortfolio(
    String id,
    Map<String, dynamic> payload,
  ) async {
    saveCalls++;
    return saveProjectPortfolioResult;
  }

  @override
  Future<Result<void>> deleteProjectPortfolio(String id) async {
    deleteCalls++;
    return deleteResult;
  }
}

void main() {
  late FakeProjectsRepository fakeRepository;
  late ProviderContainer container;

  setUp(() {
    fakeRepository = FakeProjectsRepository();
    container = ProviderContainer(
      overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),
      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),
      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),
        projectsRepositoryProvider.overrideWithValue(fakeRepository),
        activeTenantIdProvider.overrideWithValue('tenant-1'),
      ],
    );
    addTearDown(container.dispose);
  });

  group('ProjectListController', () {
    test('build loads page 1 with projects', () async {
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final ProjectListState state = container.read(projectListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.items[0].id, 'prj1');
      expect(state.isLoading, isFalse);
    });

    test('refresh reloads from page 1', () async {
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container.read(projectListControllerProvider.notifier).refresh();

      final ProjectListState state = container.read(projectListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.query.page, 1);
      expect(state.isLoading, isFalse);
    });

    test('loadMore appends results', () async {
      fakeRepository.listProjectsResult =
          Result<Cacheable<Paginated<Project>>>.ok(
        Cacheable<Paginated<Project>>(
          value: _page(<Project>[_projectA], hasMore: true),
        ),
      );
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      fakeRepository.listProjectsResult =
          Result<Cacheable<Paginated<Project>>>.ok(
        Cacheable<Paginated<Project>>(
          value: _page(<Project>[_projectB], page: 2),
        ),
      );
      await container.read(projectListControllerProvider.notifier).loadMore();

      final ProjectListState state = container.read(projectListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.items[0].id, 'prj1');
      expect(state.items[1].id, 'prj2');
    });

    test('loadMore is a no-op when no more pages', () async {
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container.read(projectListControllerProvider.notifier).loadMore();
      // Only the initial load — hasMore is false by default.
      expect(container.read(projectListControllerProvider).items, hasLength(2));
    });

    test('search debounces and resets to page 1', () async {
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      container.read(projectListControllerProvider.notifier).search('design');
      await Future<void>.delayed(const Duration(milliseconds: 400));

      final ProjectListState state = container.read(projectListControllerProvider);
      expect(state.query.search, 'design');
      expect(state.query.page, 1);
    });

    test('applySort resets and sorts', () async {
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      container.read(projectListControllerProvider.notifier).applySort('name');

      final ProjectListState state = container.read(projectListControllerProvider);
      expect(state.query.sort, 'name');
      expect(state.query.page, 1);
    });

    test('applyFilters resets with filters', () async {
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      container
          .read(projectListControllerProvider.notifier)
          .applyFilters(<String, String>{'status': 'ACTIVE'});

      final ProjectListState state = container.read(projectListControllerProvider);
      expect(state.query.filters, <String, String>{'status': 'ACTIVE'});
      expect(state.query.page, 1);
    });

    test('save creates and refreshes', () async {
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final Result<Project> result = await container
          .read(projectListControllerProvider.notifier)
          .save(<String, dynamic>{'name': 'New'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.saveCalls, 1);
    });

    test('save with id updates and refreshes', () async {
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final Result<Project> result = await container
          .read(projectListControllerProvider.notifier)
          .save(<String, dynamic>{'name': 'Updated'}, id: 'prj1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.saveCalls, 1);
    });

    test('delete removes and refreshes', () async {
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final Result<void> result = await container
          .read(projectListControllerProvider.notifier)
          .delete('prj1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteCalls, 1);
    });

    test('repository failure surfaces as state.failure without crashing',
        () async {
      fakeRepository.listProjectsResult =
          Result<Cacheable<Paginated<Project>>>.err(
        ServerFailure('API is down'),
      );
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final ProjectListState state = container.read(projectListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
      expect(state.isLoading, isFalse);
    });

    test('delete failure surfaces from repository', () async {
      fakeRepository.deleteResult = Result<void>.err(
        ServerFailure('Cannot delete'),
      );
      container.read(projectListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final Result<void> result = await container
          .read(projectListControllerProvider.notifier)
          .delete('prj1');

      expect(result.isErr, isTrue);
      expect(result.failureOrNull, isA<ServerFailure>());
    });
  });

  group('TaskListController', () {
    test('build loads page 1 with tasks', () async {
      container.read(taskListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final TaskListState state = container.read(taskListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.items[0].id, 't1');
      expect(state.isLoading, isFalse);
    });

    test('loadMore appends data', () async {
      fakeRepository.listTasksResult =
          Result<Cacheable<Paginated<Task>>>.ok(
        Cacheable<Paginated<Task>>(
          value: _page(<Task>[_taskA], hasMore: true),
        ),
      );
      container.read(taskListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      fakeRepository.listTasksResult =
          Result<Cacheable<Paginated<Task>>>.ok(
        Cacheable<Paginated<Task>>(
          value: _page(<Task>[_taskB], page: 2),
        ),
      );
      await container.read(taskListControllerProvider.notifier).loadMore();

      final TaskListState state = container.read(taskListControllerProvider);
      expect(state.items, hasLength(2));
    });

    test('delete removes and refreshes', () async {
      container.read(taskListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final Result<void> result = await container
          .read(taskListControllerProvider.notifier)
          .delete('t1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteCalls, 1);
    });

    test('save creates and refreshes', () async {
      container.read(taskListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final Result<Task> result = await container
          .read(taskListControllerProvider.notifier)
          .save(<String, dynamic>{'title': 'New task', 'projectId': 'prj1'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.saveCalls, 1);
    });

    test('repository failure surfaces without crashing', () async {
      fakeRepository.listTasksResult =
          Result<Cacheable<Paginated<Task>>>.err(
        ServerFailure('Tasks unavailable'),
      );
      container.read(taskListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final TaskListState state = container.read(taskListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  group('MilestoneListController', () {
    test('build loads page 1', () async {
      container.read(milestoneListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final MilestoneListState state =
          container.read(milestoneListControllerProvider);
      expect(state.items, hasLength(1));
      expect(state.items[0].id, 'm1');
      expect(state.isLoading, isFalse);
    });

    test('repository failure surfaces without crashing', () async {
      fakeRepository.listMilestonesResult =
          Result<Cacheable<Paginated<Milestone>>>.err(
        ServerFailure('Milestones unavailable'),
      );
      container.read(milestoneListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final MilestoneListState state =
          container.read(milestoneListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  group('ProjectBudgetListController', () {
    test('build loads page 1 after setProjectId', () async {
      container.read(projectBudgetListControllerProvider);
      container
          .read(projectBudgetListControllerProvider.notifier)
          .setProjectId('prj1');
      await Future<void>.delayed(Duration.zero);

      final ProjectBudgetListState state =
          container.read(projectBudgetListControllerProvider);
      expect(state.items, hasLength(1));
      expect(state.items[0].id, 'b1');
      expect(state.isLoading, isFalse);
    });

    test('save creates and refreshes', () async {
      container.read(projectBudgetListControllerProvider);
      container
          .read(projectBudgetListControllerProvider.notifier)
          .setProjectId('prj1');
      await Future<void>.delayed(Duration.zero);

      final Result<ProjectBudget> result = await container
          .read(projectBudgetListControllerProvider.notifier)
          .save(<String, dynamic>{
        'category': 'Materials',
        'budgetedAmount': 10000,
      });

      expect(result.isOk, isTrue);
      expect(fakeRepository.saveCalls, 1);
    });

    test('repository failure surfaces without crashing', () async {
      fakeRepository.listProjectBudgetsResult =
          Result<Cacheable<Paginated<ProjectBudget>>>.err(
        ServerFailure('Budgets unavailable'),
      );
      container.read(projectBudgetListControllerProvider);
      container
          .read(projectBudgetListControllerProvider.notifier)
          .setProjectId('prj1');
      await Future<void>.delayed(Duration.zero);

      final ProjectBudgetListState state =
          container.read(projectBudgetListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  group('ProjectRiskListController', () {
    test('build loads page 1 after setProjectId', () async {
      container.read(projectRiskListControllerProvider);
      container
          .read(projectRiskListControllerProvider.notifier)
          .setProjectId('prj1');
      await Future<void>.delayed(Duration.zero);

      final ProjectRiskListState state =
          container.read(projectRiskListControllerProvider);
      expect(state.items, hasLength(1));
      expect(state.items[0].id, 'r1');
      expect(state.isLoading, isFalse);
    });

    test('repository failure surfaces without crashing', () async {
      fakeRepository.listProjectRisksResult =
          Result<Cacheable<Paginated<ProjectRisk>>>.err(
        ServerFailure('Risks unavailable'),
      );
      container.read(projectRiskListControllerProvider);
      container
          .read(projectRiskListControllerProvider.notifier)
          .setProjectId('prj1');
      await Future<void>.delayed(Duration.zero);

      final ProjectRiskListState state =
          container.read(projectRiskListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  group('ProjectPortfolioListController', () {
    test('build loads page 1', () async {
      container.read(projectPortfolioListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final ProjectPortfolioListState state =
          container.read(projectPortfolioListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.items[0].id, 'pf1');
      expect(state.items[1].id, 'pf2');
      expect(state.isLoading, isFalse);
    });

    test('save creates and refreshes', () async {
      container.read(projectPortfolioListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final Result<ProjectPortfolio> result = await container
          .read(projectPortfolioListControllerProvider.notifier)
          .save(<String, dynamic>{'name': 'New Portfolio'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.saveCalls, 1);
    });

    test('delete removes and refreshes', () async {
      container.read(projectPortfolioListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final Result<void> result = await container
          .read(projectPortfolioListControllerProvider.notifier)
          .delete('pf1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteCalls, 1);
    });

    test('repository failure surfaces without crashing', () async {
      fakeRepository.listProjectPortfoliosResult =
          Result<Cacheable<Paginated<ProjectPortfolio>>>.err(
        ServerFailure('Portfolios unavailable'),
      );
      container.read(projectPortfolioListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final ProjectPortfolioListState state =
          container.read(projectPortfolioListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  group('TimesheetListController', () {
    test('build loads page 1', () async {
      container.read(timesheetListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final TimesheetListState state =
          container.read(timesheetListControllerProvider);
      expect(state.items, hasLength(1));
      expect(state.items[0].id, 'ts1');
      expect(state.isLoading, isFalse);
    });

    test('save creates and refreshes', () async {
      container.read(timesheetListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final Result<Timesheet> result = await container
          .read(timesheetListControllerProvider.notifier)
          .save(<String, dynamic>{
        'projectId': 'prj1',
        'hours': 8,
        'date': '2026-06-20',
      });

      expect(result.isOk, isTrue);
      expect(fakeRepository.saveCalls, 1);
    });

    test('repository failure surfaces without crashing', () async {
      fakeRepository.listTimesheetsResult =
          Result<Cacheable<Paginated<Timesheet>>>.err(
        ServerFailure('Timesheets unavailable'),
      );
      container.read(timesheetListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final TimesheetListState state =
          container.read(timesheetListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
