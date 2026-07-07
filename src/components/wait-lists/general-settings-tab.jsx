"use client";

import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";

export function GeneralSettingsTab({ formSettings, updateSetting }) {
	return (
		<TabsContent value="general" className="py-4 space-y-4">
			<div className="flex items-center justify-between">
				<Label htmlFor="buttonColor">Button Color</Label>
				<ColorPicker
					id="buttonColor"
					value={formSettings.buttonColor}
					onChange={(color) => updateSetting("buttonColor", color)}
				/>
			</div>
			<div className="flex items-center justify-between">
				<Label htmlFor="buttonBorder">Button Border</Label>
				<ColorPicker
					id="buttonBorder"
					value={formSettings.buttonBorder}
					onChange={(color) => updateSetting("buttonBorder", color)}
				/>
			</div>
			<div className="flex items-center justify-between">
				<Label htmlFor="buttonTextColor">Button Text Color</Label>
				<ColorPicker
					id="buttonTextColor"
					value={formSettings.buttonTextColor}
					onChange={(color) => updateSetting("buttonTextColor", color)}
				/>
			</div>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label htmlFor="enableMainBgColor">Enable Background Color</Label>
					<Switch
						id="enableMainBgColor"
						checked={formSettings.enableMainBgColor}
						onCheckedChange={(checked) =>
							updateSetting("enableMainBgColor", checked)
						}
					/>
				</div>

				{formSettings.enableMainBgColor && (
					<div className="flex items-center justify-between">
						<Label htmlFor="mainBgColor">Background Color</Label>
						<ColorPicker
							id="mainBgColor"
							value={formSettings.mainBgColor}
							onChange={(color) => updateSetting("mainBgColor", color)}
						/>
					</div>
				)}
			</div>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label htmlFor="enableBgColor">Enable Widget BG Color</Label>
					<Switch
						id="enableBgColor"
						checked={formSettings.enableBgColor}
						onCheckedChange={(checked) =>
							updateSetting("enableBgColor", checked)
						}
					/>
				</div>

				{formSettings.enableBgColor && (
					<div className="flex items-center justify-between">
						<Label htmlFor="bgColor">Widget BG Color</Label>
						<ColorPicker
							id="bgColor"
							value={formSettings.bgColor}
							onChange={(color) => updateSetting("bgColor", color)}
						/>
					</div>
				)}
			</div>
			<div>
				<Label htmlFor="borderWidth">Border Width</Label>
				<Select
					value={formSettings.borderWidth}
					onValueChange={(value) => updateSetting("borderWidth", value)}
				>
					<SelectTrigger id="borderWidth">
						<SelectValue placeholder="Select border width" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0px">0px</SelectItem>
						<SelectItem value="1px">1px</SelectItem>
						<SelectItem value="2px">2px</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div>
				<Label htmlFor="borderRadius">Border Radius</Label>
				<Select
					value={formSettings.borderRadius}
					onValueChange={(value) => updateSetting("borderRadius", value)}
				>
					<SelectTrigger id="borderRadius">
						<SelectValue placeholder="Select border radius" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="small">Small</SelectItem>
						<SelectItem value="medium">Medium</SelectItem>
						<SelectItem value="large">Large</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div>
				<Label htmlFor="fontWeight">Font Weight</Label>
				<Select
					value={formSettings.fontWeight}
					onValueChange={(value) => updateSetting("fontWeight", value)}
				>
					<SelectTrigger id="fontWeight">
						<SelectValue placeholder="Select font weight" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="normal">Normal</SelectItem>
						<SelectItem value="bold">Bold</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div>
				<Label htmlFor="logoSize">Logo Size</Label>
				<Select
					value={formSettings.logoSize}
					onValueChange={(value) => updateSetting("logoSize", value)}
				>
					<SelectTrigger id="logoSize">
						<SelectValue placeholder="Select logo size" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="1X">1X</SelectItem>
						<SelectItem value="2X">2X</SelectItem>
					</SelectContent>
				</Select>
			</div>
			{formSettings.showBadge && (
				<>
					<div>
						<Label htmlFor="badgeText">Badge Text</Label>
						<Input
							id="badgeText"
							value={formSettings.badgeText}
							onChange={(e) => updateSetting("badgeText", e.target.value)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="badgeColor">Badge Color</Label>
						<ColorPicker
							id="badgeColor"
							value={formSettings.badgeColor}
							onChange={(color) => updateSetting("badgeColor", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="badgeTextColor">Badge Text Color</Label>
						<ColorPicker
							id="badgeTextColor"
							value={formSettings.badgeTextColor}
							onChange={(color) => updateSetting("badgeTextColor", color)}
						/>
					</div>
				</>
			)}
			<div>
				<Label htmlFor="buttonText">Button Text</Label>
				<Input
					id="buttonText"
					value={formSettings.buttonText}
					onChange={(e) => updateSetting("buttonText", e.target.value)}
				/>
			</div>
			<div>
				<Label htmlFor="successMessage">Success Message</Label>
				<Input
					id="successMessage"
					value={formSettings.successMessage}
					onChange={(e) => updateSetting("successMessage", e.target.value)}
				/>
			</div>
			<div className="flex items-center space-x-2">
				<Switch
					id="sendEmailsToSubscribers"
					checked={formSettings.sendEmailsToSubscribers}
					onCheckedChange={(checked) => updateSetting("sendEmailsToSubscribers", checked)}
				/>
				<Label htmlFor="sendEmailsToSubscribers">Send Email to Subscribers</Label>
			</div>
			<div className="flex items-center space-x-2">
				<Switch
					id="showLogo"
					checked={formSettings.showLogo}
					onCheckedChange={(checked) => updateSetting("showLogo", checked)}
				/>
				<Label htmlFor="showLogo">Show Logo</Label>
			</div>
			<div className="flex items-center space-x-2">
				<Switch
					id="showSocialProof"
					checked={formSettings.showSocialProof}
					onCheckedChange={(checked) =>
						updateSetting("showSocialProof", checked)
					}
				/>
				<Label htmlFor="showSocialProof">Show Social Proof</Label>
			</div>
			<div className="flex items-center space-x-2">
				<Switch
					id="showBadge"
					checked={formSettings.showBadge}
					onCheckedChange={(checked) => updateSetting("showBadge", checked)}
				/>
				<Label htmlFor="showBadge">Show Badge</Label>
			</div>
			<div className="flex items-center space-x-2">
				<Switch
					id="showReferrals"
					checked={formSettings.showReferrals}
					onCheckedChange={(checked) =>
						updateSetting("showReferrals", checked)
					}
				/>
				<Label htmlFor="showReferrals">Show Referral System</Label>
			</div>
			<div className="flex items-center space-x-2">
				<Switch
					id="showBranding"
					checked={formSettings.showBranding}
					onCheckedChange={(checked) =>
						updateSetting("showBranding", checked)
					}
				/>
				<Label htmlFor="showBranding">Show Waitlyze branding</Label>
			</div>
		</TabsContent>
	);
}
