export declare class SecurityController {
    getIsolationMatrix(): {
        status: string;
        timestamp: string;
        total_tests: number;
        passed_tests: number;
        failed_tests: number;
        matrix: {
            id: string;
            name: string;
            result: string;
        }[];
    };
    getHardeningStatus(): {
        environment: string;
        score: string;
        checks: {
            category: string;
            status: string;
            details: string;
        }[];
    };
}
