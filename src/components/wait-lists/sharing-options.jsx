"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function SharingOptions({ formSettings, updateSetting }) {
	return (
		<div className="space-y-4">
			<h3 className="font-medium">Sharing Options</h3>
			<p className="text-sm text-muted-foreground">
				Pick which links we show on the post-signup section for users to
				share their referral links on.
			</p>
			<div className="space-y-4">
				<div className="flex items-center space-x-2">
					<Checkbox
						id="twitter-share"
						checked={formSettings.shareOnTwitter}
						onCheckedChange={(checked) =>
							updateSetting("shareOnTwitter", checked)
						}
					/>
					<Label htmlFor="twitter-share">Twitter/X</Label>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="whatsapp-share"
						checked={formSettings.shareOnWhatsapp}
						onCheckedChange={(checked) =>
							updateSetting("shareOnWhatsapp", checked)
						}
					/>
					<Label htmlFor="whatsapp-share">WhatsApp</Label>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="instagram-share"
						checked={formSettings.shareOnInstagram}
						onCheckedChange={(checked) =>
							updateSetting("shareOnInstagram", checked)
						}
					/>
					<Label htmlFor="instagram-share">Instagram</Label>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="facebook-share"
						checked={formSettings.shareOnFacebook}
						onCheckedChange={(checked) =>
							updateSetting("shareOnFacebook", checked)
						}
					/>
					<Label htmlFor="facebook-share">Facebook</Label>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="linkedin-share"
						checked={formSettings.shareOnLinkedin}
						onCheckedChange={(checked) =>
							updateSetting("shareOnLinkedin", checked)
						}
					/>
					<Label htmlFor="linkedin-share">LinkedIn</Label>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="email-share"
						checked={formSettings.shareOnEmail}
						onCheckedChange={(checked) =>
							updateSetting("shareOnEmail", checked)
						}
					/>
					<Label htmlFor="email-share">Email</Label>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="reddit-share"
						checked={formSettings.shareOnReddit}
						onCheckedChange={(checked) =>
							updateSetting("shareOnReddit", checked)
						}
					/>
					<Label htmlFor="reddit-share">Reddit</Label>
				</div>
			</div>
		</div>
	);
}
