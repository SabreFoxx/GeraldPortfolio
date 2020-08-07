import { TestBed } from '@angular/core/testing';

import { DrawUtilityService } from './draw-utility.service';

describe('DrawUtilityService', () => {
  let service: DrawUtilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DrawUtilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
