import { defineModule, defineResource } from '@unerp/framework';

export const employeeResource = defineResource({
  name: 'employees',
  labelSingular: 'Employee',
  labelPlural: 'Employees',
  endpoint: '/hr/employees',
  titleField: 'employeeCode',
  permissions: {
    read: 'hr.employee.read',
    create: 'hr.employee.create',
    update: 'hr.employee.update',
    delete: 'hr.employee.delete',
  },
  status: {
    field: 'status',
    tones: { ACTIVE: 'success', INVITED: 'info', LEAVE: 'warning', TERMINATED: 'danger' },
  },
  fields: [
    { name: 'employeeCode', label: 'Employee Code', type: 'text', required: true },
    { name: 'firstName', label: 'First Name', type: 'text', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'designation', label: 'Designation', type: 'text' },
    { name: 'departmentId', label: 'Department', type: 'link', link: { resource: 'departments', labelField: 'name' } },
    { name: 'employmentType', label: 'Employment Type', type: 'select', defaultValue: 'FULL_TIME', options: [
      { value: 'FULL_TIME', label: 'Full Time' }, { value: 'PART_TIME', label: 'Part Time' },
      { value: 'CONTRACT', label: 'Contract' }, { value: 'INTERN', label: 'Intern' },
    ] },
    { name: 'status', label: 'Status', type: 'select', defaultValue: 'ACTIVE', options: [
      { value: 'ACTIVE', label: 'Active' }, { value: 'INVITED', label: 'Invited' },
      { value: 'LEAVE', label: 'On Leave' }, { value: 'TERMINATED', label: 'Terminated' },
    ] },
    { name: 'dateOfJoining', label: 'Date of Joining', type: 'date' },
  ],
  list: {
    columns: ['employeeCode', 'firstName', 'lastName', 'email', 'designation', 'departmentId', 'employmentType', 'status', 'dateOfJoining'],
    searchable: true,
    pageSize: 25,
    defaultSort: { field: 'employeeCode', direction: 'asc' },
    filters: ['status', 'employmentType', 'departmentId'],
    selectable: true,
    savedViews: true,
  },
  form: { sections: [
    { title: 'Profile', fields: ['employeeCode', 'firstName', 'lastName', 'email', 'phone'] },
    { title: 'Employment', fields: ['designation', 'departmentId', 'employmentType', 'status', 'dateOfJoining'] },
  ] },
});

export const departmentResource = defineResource({
  name: 'departments',
  labelSingular: 'Department',
  labelPlural: 'Departments',
  endpoint: '/hr/departments',
  titleField: 'name',
  // The current API exposes departments as a read-only lookup for HR masters.
  permissions: { read: 'hr.department.read' },
  fields: [
    { name: 'name', label: 'Department Name', type: 'text', required: true },
    { name: 'code', label: 'Department Code', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  list: { columns: ['name', 'code', 'description', '_count'], searchable: true, pageSize: 25, defaultSort: { field: 'name', direction: 'asc' } },
});

export const hrModule = defineModule({
  id: 'hr',
  title: 'Human Resources',
  basePath: '/hr',
  permission: 'hr.employee.read',
  resources: [employeeResource, departmentResource],
});
