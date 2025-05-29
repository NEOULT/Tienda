import { TestBed } from '@angular/core/testing';

import { ApiWrapperService } from './api-wrapper.service';

describe('ApiWrapperService', () => {
  let service: ApiWrapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiWrapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
