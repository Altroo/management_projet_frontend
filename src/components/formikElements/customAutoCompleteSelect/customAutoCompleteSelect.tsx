import { type Key, type FC, type FocusEvent, type HTMLAttributes, type ReactNode, type SyntheticEvent } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import type { Theme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import type { DropDownType } from '@/types/accountTypes';
import { Autocomplete, Box, InputAdornment, Typography } from '@mui/material';

type Props = {
	id: string;
	label: string;
	items: Array<DropDownType>;
	theme: Theme;
	value: DropDownType | null;
	noOptionsText: string;
	size?: 'small' | 'medium';
	fullWidth?: boolean;
	onChange?: (event: SyntheticEvent, newValue: DropDownType | null) => void;
	onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
	helperText?: string;
	error?: boolean;
	disabled?: boolean;
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	slotProps?: TextFieldProps['slotProps'];
	renderOption?: (props: HTMLAttributes<HTMLLIElement> & { key: Key }, option: DropDownType) => ReactNode;
};

const CustomAutoCompleteSelect: FC<Props> = ({
	id,
	label,
	items,
	theme,
	value,
	fullWidth,
	onChange,
	disabled,
	slotProps,
	startIcon,
	endIcon,
	noOptionsText,
	size,
	onBlur,
	error,
	helperText,
	renderOption: renderOptionProp,
}) => {
	const defaultRenderOption = (props: HTMLAttributes<HTMLLIElement> & { key: Key }, option: DropDownType) => {
		const { key, ...rest } = props;
		return (
			<Box component="li" key={key} {...rest}>
				<Typography variant="body2" noWrap sx={{ flex: 1 }}>
					{option.value}
				</Typography>
			</Box>
		);
	};

	return (
		<ThemeProvider theme={theme}>
			<Autocomplete
				id={id}
				size={size}
				fullWidth={fullWidth}
				noOptionsText={noOptionsText}
				options={items}
				getOptionLabel={(option) => option.value}
				getOptionKey={(option) => option.value}
				filterOptions={(options, state) =>
					options.filter((opt) => opt.value.toLowerCase().includes(state.inputValue.toLowerCase()))
				}
				value={value}
				onChange={onChange}
				disabled={disabled}
				isOptionEqualToValue={(option, val) => option.value === val.value}
				onBlur={onBlur}
				renderOption={(props, option) =>
					(renderOptionProp || defaultRenderOption)(props as HTMLAttributes<HTMLLIElement> & { key: Key }, option)
				}
				renderInput={(params) => (
					<TextField
						{...params}
						label={label}
						error={error}
						helperText={helperText}
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: '12px',
							},
						}}
						slotProps={{
							...params.slotProps,
							...slotProps,

							input: {
								...params.slotProps.input,
								...slotProps?.input,
								startAdornment: (
									<>
										{startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>}
										{params.slotProps.input.startAdornment}
									</>
								),
								endAdornment: (
									<>
										{params.slotProps.input.endAdornment}
										{endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>}
									</>
								),
							},
						}}
					/>
				)}
			/>
		</ThemeProvider>
	);
};

export default CustomAutoCompleteSelect;
