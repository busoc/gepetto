export class TimelineBand {
    constructor (
        public label: string,
        public value: {
            label: string,
            description: string,
            type: string,
            interactive: boolean,
            what?: string,
            style?: {
                gutterBackgroundColor?: string,
                backgroundColor?: string,
                textColor?: string,
                borderColor?: string,
                bandBackgroundColor?: string,
                sidebarBackgroundColor?: string,
            }
            bands?: [
                {
                    type: string,
                    color: string
                },
                {
                    type: string,
                    color: string
                }
            ],
            events?: any[],
            hatchUncovered?: boolean,
            interactiveSidebar?: boolean,
            incrementStartDate?: string,
            incrementEndDate?: string,
            visibleZoomLevel?: number,
            tz?: string, // timescale
            filterCategories?: string[],
            band?: string, // optimis band
            yamcsInstance?: string,
            yamcsParameter?: string,
            leakEventBackground?: boolean,
            showExecutedTimes?: boolean,
            // asimfilter?: boolean,
            optimisFilter?: String,
            hideTitle?: boolean
        }
    ) {}
  }
