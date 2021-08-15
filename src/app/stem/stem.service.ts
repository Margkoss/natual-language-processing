import { BaseService } from '@common/interfaces/service.base';
import { StemRepository } from './stem.repository';

export class StemService implements BaseService {
    private readonly stemRepository: StemRepository;

    constructor() {
        this.stemRepository = new StemRepository();
    }
}
