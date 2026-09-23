import { Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
const tooltipKey = `& .${tooltipClasses.tooltip}`;
const arrowKey = `& .${tooltipClasses.arrow}`;

const DarkTooltip = (props: TooltipProps) => (
	<Tooltip
		{...props}
		arrow
		placement="bottom-end"
		sx={{
			[tooltipKey]: {
				backgroundColor: '#000 !important',
				color: '#fff !important',
				fontSize: '0.75rem !important',
				borderRadius: '4px !important',
				boxShadow: '1px !important',
			},
			[arrowKey]: {
				color: '#000 !important',
			},
		}}
	/>
);

export default DarkTooltip;
