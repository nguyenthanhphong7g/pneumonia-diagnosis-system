USE [Pneumonia]
GO
/****** Object:  Table [dbo].[admin_logs]    Script Date: 6/4/2026 1:39:44 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[admin_logs](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[admin_id] [bigint] NULL,
	[action] [nvarchar](255) NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[diagnosis_history]    Script Date: 6/4/2026 1:39:44 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[diagnosis_history](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[confidence] [float] NULL,
	[created_at] [datetime2](7) NULL,
	[image_path] [varchar](255) NULL,
	[label] [varchar](255) NULL,
	[user_id] [bigint] NOT NULL,
	[inference_time_ms] [int] NOT NULL CONSTRAINT [DF__diagnosis__infer__19DFD96B]  DEFAULT ((0)),
	[gradcam_path] [varchar](255) NULL,
	[model_id] [int] NULL,
 CONSTRAINT [PK__diagnosi__3213E83F5B05EC63] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[expert_reviews]    Script Date: 6/4/2026 1:39:44 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[expert_reviews](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[diagnosis_id] [bigint] NOT NULL,
	[doctor_id] [bigint] NOT NULL,
	[final_label] [varchar](50) NOT NULL,
	[doctor_comment] [nvarchar](max) NULL,
	[is_used_for_training] [bit] NOT NULL DEFAULT ((0)),
	[reviewed_at] [datetime2](7) NOT NULL DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[model_metrics]    Script Date: 6/4/2026 1:39:44 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[model_metrics](
	[model_id] [int] IDENTITY(1,1) NOT NULL,
	[model_name] [nvarchar](100) NOT NULL,
	[accuracy] [float] NULL,
	[precision_score] [float] NULL,
	[recall_score] [float] NULL,
	[f1_score] [float] NULL,
	[auc_score] [float] NULL,
	[expected_runtime_ms] [int] NOT NULL DEFAULT ((0)),
	[version] [nvarchar](50) NULL DEFAULT ('1.0'),
	[trained_date] [datetime] NULL DEFAULT (getdate()),
	[created_at] [datetime] NULL DEFAULT (getdate()),
	[updated_at] [datetime] NULL DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[model_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[roles]    Script Date: 6/4/2026 1:39:44 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[roles](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[users]    Script Date: 6/4/2026 1:39:44 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[users](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[username] [nvarchar](100) NOT NULL,
	[email] [nvarchar](150) NOT NULL,
	[password] [nvarchar](255) NOT NULL,
	[role_id] [int] NOT NULL,
	[created_at] [datetime] NULL DEFAULT (getdate()),
	[role] [varchar](50) NOT NULL DEFAULT ('USER'),
	[enabled] [bit] NOT NULL DEFAULT ((1)),
	[address] [nvarchar](255) NULL,
	[full_name] [nvarchar](255) NULL,
	[locked_at] [datetime2](7) NULL,
	[locked_reason] [nvarchar](255) NULL,
	[phone] [nvarchar](20) NULL,
	[status] [nvarchar](20) NULL,
	[date_of_birth] [date] NULL,
	[gender] [nvarchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_PADDING OFF
GO
SET IDENTITY_INSERT [dbo].[diagnosis_history] ON 

INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (1, 0.99068301726533092, CAST(N'2026-05-22 10:22:22.5659275' AS DateTime2), N'/uploads/1779420139814_person1_virus_6.jpeg', N'Pneumonia', 21, 2728, N'/uploads/gradcams/1779420144455_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (2, 0.99068301726533092, CAST(N'2026-05-22 12:22:36.8684297' AS DateTime2), N'/uploads/1779427347753_person1_virus_6.jpeg', N'Pneumonia', 23, 9031, N'/uploads/gradcams/1779427365983_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (3, 0.99068301726533092, CAST(N'2026-05-22 12:32:41.9514841' AS DateTime2), N'/uploads/1779427960092_person1_virus_6.jpeg', N'Pneumonia', 23, 1845, N'/uploads/gradcams/1779427963243_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (4, 0.990851775990777, CAST(N'2026-05-22 12:37:13.2273229' AS DateTime2), N'/uploads/1779428208480_person1_virus_6.jpeg', N'Pneumonia', 23, 24731, N'/uploads/gradcams/1779428242566_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (5, 0.99795954945731913, CAST(N'2026-05-22 16:23:48.3523108' AS DateTime2), N'/uploads/1779441826506_fd943cc03bb4bcafe60c7acf0b4c48_jumbo.jpeg', N'Normal', 23, 1826, N'/uploads/gradcams/1779441829562_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (6, 0.99028749980466868, CAST(N'2026-05-22 22:17:13.7355322' AS DateTime2), N'/uploads/1779463028081_viem-phoi-hit.png', N'Normal', 23, 5427, N'/uploads/gradcams/1779463038352_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (7, 0.999903243608499, CAST(N'2026-05-22 23:30:53.5901209' AS DateTime2), N'/uploads/1779467450309_IM-0009-0001.jpeg', N'Normal', 23, 3181, N'/uploads/gradcams/1779467457470_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (8, 0.99579755253199742, CAST(N'2026-05-22 23:31:19.5620237' AS DateTime2), N'/uploads/1779467477538_NORMAL2-IM-0095-0001.jpeg', N'Normal', 23, 2013, N'/uploads/gradcams/1779467481421_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (9, 0.97232869308253755, CAST(N'2026-05-22 23:31:53.7113700' AS DateTime2), N'/uploads/1779467511816_person3_virus_15.jpeg', N'Normal', 23, 1883, N'/uploads/gradcams/1779467515450_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (10, 0.99299078565948684, CAST(N'2026-05-22 23:46:23.5382635' AS DateTime2), N'/uploads/1779468381088_person1_virus_11.jpeg', N'Pneumonia', 23, 2430, N'/uploads/gradcams/1779468385978_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (11, 0.99846061993813151, CAST(N'2026-05-23 00:33:01.2692133' AS DateTime2), N'/uploads/1779471179085_person3_virus_15.jpeg', N'Pneumonia', 23, 2157, N'/uploads/gradcams/1779471182809_gradcam.jpg', 2)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (12, 0.63591052134584869, CAST(N'2026-05-26 09:19:52.9274517' AS DateTime2), N'/uploads/1779761991071_pneunomia (3).jpeg', N'Normal', 23, 1789, N'/uploads/gradcams/1779761994160_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (13, 0.63591052134584869, CAST(N'2026-05-26 16:24:45.7034143' AS DateTime2), N'/uploads/1779787476161_pneunomia (3).jpeg', N'Normal', 23, 9445, N'/uploads/gradcams/1779787491589_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (14, 0.9996485268548867, CAST(N'2026-05-26 18:36:11.3235850' AS DateTime2), N'/uploads/1779795355360_normal (2).jpeg', N'Normal', 23, 15673, N'/uploads/gradcams/1779795376845_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (15, 0.63591052134584869, CAST(N'2026-05-27 00:37:44.5058062' AS DateTime2), N'/uploads/1779817052934_pneunomia (3).jpeg', N'Normal', 23, 11408, N'/uploads/gradcams/1779817069286_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (16, 0.99699198531466127, CAST(N'2026-05-27 00:38:41.1039298' AS DateTime2), N'/uploads/1779817107759_pneunomia (3).jpeg', N'Pneumonia', 23, 13027, N'/uploads/gradcams/1779817138577_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (17, 0.99797578027370815, CAST(N'2026-05-27 00:39:17.4153899' AS DateTime2), N'/uploads/1779817153785_normal (2).jpeg', N'Normal', 23, 3596, N'/uploads/gradcams/1779817161243_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (18, 0.99410905201738065, CAST(N'2026-05-27 00:39:38.2421548' AS DateTime2), N'/uploads/1779817174803_724c3f94-x-quang-phoi-binh-thuong-3 (1).jpg', N'Normal', 23, 3415, N'/uploads/gradcams/1779817181471_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (19, 0.94641575466107886, CAST(N'2026-05-27 00:39:59.6631926' AS DateTime2), N'/uploads/1779817196043_0a9802be-hinh-anh-x-quang-viem-phoi-5.jpg', N'Pneumonia', 23, 3591, N'/uploads/gradcams/1779817203006_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (20, 0.9440917448142796, CAST(N'2026-05-27 10:50:25.3954594' AS DateTime2), N'/uploads/1779853809559_person10_virus_35.jpeg', N'Pneumonia', 23, 15608, N'/uploads/gradcams/1779853835543_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (21, 0.84811166766983781, CAST(N'2026-05-27 10:51:47.4936729' AS DateTime2), N'/uploads/1779853905685_person89_bacteria_440.jpeg', N'Pneumonia', 23, 1798, N'/uploads/gradcams/1779853908666_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (22, 0.9537693629629439, CAST(N'2026-05-27 10:53:00.8839504' AS DateTime2), N'/uploads/1779853978994_person1672_virus_2888.jpeg', N'Normal', 23, 1873, N'/uploads/gradcams/1779853982254_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (23, 0.84811166766983781, CAST(N'2026-05-27 10:53:29.0599481' AS DateTime2), N'/uploads/1779854007291_person89_bacteria_440.jpeg', N'Pneumonia', 23, 1756, N'/uploads/gradcams/1779854010244_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (24, 0.99933748982371762, CAST(N'2026-05-27 10:54:05.1061657' AS DateTime2), N'/uploads/1779854043177_person34_virus_76.jpeg', N'Pneumonia', 23, 1916, N'/uploads/gradcams/1779854046489_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (25, 0.88748447264628516, CAST(N'2026-05-27 10:55:03.2259241' AS DateTime2), N'/uploads/1779854101497_person108_bacteria_511.jpeg', N'Pneumonia', 23, 1715, N'/uploads/gradcams/1779854104442_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (26, 0.84811166766983781, CAST(N'2026-05-27 10:55:31.1981728' AS DateTime2), N'/uploads/1779854129385_person89_bacteria_440.jpeg', N'Pneumonia', 23, 1801, N'/uploads/gradcams/1779854132342_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (27, 0.99940299656642584, CAST(N'2026-05-27 11:17:52.9520724' AS DateTime2), N'/uploads/1779855470797_person1643_virus_2843.jpeg', N'Pneumonia', 23, 2135, N'/uploads/gradcams/1779855474671_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (28, 0.99803451498061435, CAST(N'2026-05-27 11:18:21.5474919' AS DateTime2), N'/uploads/1779855499274_person99_bacteria_473.jpeg', N'Pneumonia', 23, 2259, N'/uploads/gradcams/1779855503237_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (29, 0.99797578027370815, CAST(N'2026-05-28 01:00:40.8611900' AS DateTime2), N'/uploads/1779904836353_normal (2).jpeg', N'Normal', 23, 4461, N'/uploads/gradcams/1779904844929_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (30, 0.99797578027370815, CAST(N'2026-05-28 01:04:18.1209565' AS DateTime2), N'/uploads/1779905054236_normal (2).jpeg', N'Normal', 23, 3851, N'/uploads/gradcams/1779905061205_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (31, 0.90277820825576782, CAST(N'2026-05-28 01:22:29.4217695' AS DateTime2), N'/uploads/1779906145067_Corona-Virus_05.png', N'Pneumonia', 23, 4315, N'/uploads/gradcams/1779906149422_gradcam.png', NULL)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (32, 0.99699198531466127, CAST(N'2026-05-28 01:22:53.0464251' AS DateTime2), N'/uploads/1779906170696_pneunomia (3).jpeg', N'Pneumonia', 23, 2332, N'/uploads/gradcams/1779906175477_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (33, 0.99699198531466127, CAST(N'2026-05-28 01:24:42.0574641' AS DateTime2), N'/uploads/1779906279117_pneunomia (3).jpeg', N'Pneumonia', 23, 2918, N'/uploads/gradcams/1779906284117_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (34, 0.50090170115348043, CAST(N'2026-05-28 01:51:43.2266298' AS DateTime2), N'/uploads/1779907900478_viem-phoi-hit.png', N'Normal', 23, 2720, N'/uploads/gradcams/1779907905122_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (35, 0.99797578027370815, CAST(N'2026-05-28 02:05:33.5389991' AS DateTime2), N'/uploads/1779908731017_normal (2).jpeg', N'Normal', 23, 2482, N'/uploads/gradcams/1779908735956_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (36, 0.99699198531466127, CAST(N'2026-05-28 02:10:20.1806902' AS DateTime2), N'/uploads/1779909018252_pneunomia (3).jpeg', N'Pneumonia', 23, 1910, N'/uploads/gradcams/1779909022110_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (37, 0.99699198531466127, CAST(N'2026-05-28 02:13:14.3766197' AS DateTime2), N'/uploads/1779909192380_pneunomia (3).jpeg', N'Pneumonia', 23, 1980, N'/uploads/gradcams/1779909196092_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (38, 0.63110092735944046, CAST(N'2026-05-28 08:30:10.8444682' AS DateTime2), N'/uploads/1779931807239_hinh anh chup xq phoi benh nhan (502 x 600).jpg', N'Normal', 23, 3579, N'/uploads/gradcams/1779931813880_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (39, 0.99797578027370815, CAST(N'2026-05-28 08:41:08.4227539' AS DateTime2), N'/uploads/1779932465500_normal (2).jpeg', N'Normal', 23, 2886, N'/uploads/gradcams/1779932471040_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (40, 0.99410905201738065, CAST(N'2026-05-28 09:58:31.3995574' AS DateTime2), N'/uploads/1779937103239_724c3f94-x-quang-phoi-binh-thuong-3.jpg', N'Normal', 23, 8038, N'/uploads/gradcams/1779937114265_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (41, 0.60810954406192075, CAST(N'2026-05-28 10:36:32.6018825' AS DateTime2), N'/uploads/1779939390611_101d559a-hinh-anh-x-quang-viem-phoi-2.jpg', N'Pneumonia', 23, 1971, N'/uploads/gradcams/1779939394399_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (42, 0.99865849151354935, CAST(N'2026-05-28 10:39:46.7254521' AS DateTime2), N'/uploads/1779939584658_Corona-Virus_05.png', N'Pneumonia', 23, 2048, N'/uploads/gradcams/1779939589455_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (43, 0.99865849151354935, CAST(N'2026-05-28 10:39:56.3582537' AS DateTime2), N'/uploads/1779939594360_Corona-Virus_05.png', N'Pneumonia', 23, 1965, N'/uploads/gradcams/1779939598038_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (44, 0.99865849151354935, CAST(N'2026-05-28 10:40:11.1481872' AS DateTime2), N'/uploads/1779939609181_Corona-Virus_05.png', N'Pneumonia', 23, 1955, N'/uploads/gradcams/1779939612793_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (45, 0.99865849151354935, CAST(N'2026-05-28 10:43:55.4232493' AS DateTime2), N'/uploads/1779939833403_Corona-Virus_05.png', N'Pneumonia', 23, 2003, N'/uploads/gradcams/1779939837139_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (46, 0.99865849151354935, CAST(N'2026-05-28 10:54:33.3824008' AS DateTime2), N'/uploads/1779940471364_Corona-Virus_05.png', N'Pneumonia', 23, 1939, N'/uploads/gradcams/1779940474894_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (47, 0.99865849151354935, CAST(N'2026-05-28 10:55:33.7469602' AS DateTime2), N'/uploads/1779940531663_Corona-Virus_05.png', N'Pneumonia', 23, 2070, N'/uploads/gradcams/1779940535219_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (48, 0.99710724632298264, CAST(N'2026-05-28 12:14:43.6432810' AS DateTime2), N'/uploads/1779945277893_Corona-Virus_05.png', N'Pneumonia', 23, 5599, N'/uploads/gradcams/1779945286413_gradcam.jpg', 2)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (49, 0.99911186529572416, CAST(N'2026-05-28 16:28:45.7610878' AS DateTime2), N'/uploads/1779960523158_pneunomia (3).jpeg', N'Pneumonia', 23, 2583, N'/uploads/gradcams/1779960527683_gradcam.jpg', 2)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (50, 0.99699198531466127, CAST(N'2026-05-29 23:38:15.6478481' AS DateTime2), N'/uploads/1780072693814_pneunomia (3).jpeg', N'Pneumonia', 23, 1760, N'/uploads/gradcams/1780072697010_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (51, 0.99699198531466127, CAST(N'2026-06-01 09:59:04.0494637' AS DateTime2), N'/uploads/1780282739843_pneunomia (3).jpeg', N'Pneumonia', 23, 4083, N'/uploads/gradcams/1780282746744_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (52, 0.99900642844692067, CAST(N'2026-06-01 21:39:00.4550100' AS DateTime2), N'/uploads/1780324729505_viem-phoi-hit.png', N'Normal', 23, 10810, N'/uploads/gradcams/1780324743890_gradcam.jpg', 2)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (53, 0.50090170115348043, CAST(N'2026-06-01 21:39:42.3524908' AS DateTime2), N'/uploads/1780324779179_viem-phoi-hit.png', N'Normal', 23, 3147, N'/uploads/gradcams/1780324786902_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (54, 0.68927178254128907, CAST(N'2026-06-01 21:48:37.0516122' AS DateTime2), N'/uploads/1780325313965_images (2).jpg', N'Pneumonia', 23, 3065, N'/uploads/gradcams/1780325319442_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (55, 0.68927178254128907, CAST(N'2026-06-01 21:57:56.9636533' AS DateTime2), N'/uploads/1780325873296_images (2).jpg', N'Pneumonia', 23, 3648, N'/uploads/gradcams/1780325880446_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (56, 0.68927178254128907, CAST(N'2026-06-01 22:00:22.4357243' AS DateTime2), N'/uploads/1780326018952_images (2).jpg', N'Pneumonia', 23, 3450, N'/uploads/gradcams/1780326025768_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (57, 0.99699198531466127, CAST(N'2026-06-01 22:00:43.2330473' AS DateTime2), N'/uploads/1780326039693_pneunomia (3).jpeg', N'Pneumonia', 23, 3522, N'/uploads/gradcams/1780326046872_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (58, 0.99699198531466127, CAST(N'2026-06-01 22:03:46.9735987' AS DateTime2), N'/uploads/1780326222384_pneunomia (3).jpeg', N'Pneumonia', 23, 4556, N'/uploads/gradcams/1780326231341_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (59, 0.99699198531466127, CAST(N'2026-06-01 22:04:36.1135137' AS DateTime2), N'/uploads/1780326272279_pneunomia (3).jpeg', N'Pneumonia', 23, 3509, N'/uploads/gradcams/1780326279802_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (60, 0.99699198531466127, CAST(N'2026-06-01 22:04:51.1492758' AS DateTime2), N'/uploads/1780326287358_pneunomia (3).jpeg', N'Pneumonia', 23, 3753, N'/uploads/gradcams/1780326294648_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (61, 0.99699198531466127, CAST(N'2026-06-01 22:05:13.3692567' AS DateTime2), N'/uploads/1780326309696_pneunomia (3).jpeg', N'Pneumonia', 23, 3647, N'/uploads/gradcams/1780326316923_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (62, 0.99797578027370815, CAST(N'2026-06-01 22:17:20.9687507' AS DateTime2), N'/uploads/1780327037060_normal (2).jpeg', N'Normal', 23, 3557, N'/uploads/gradcams/1780327044682_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (63, 0.99797578027370815, CAST(N'2026-06-01 22:19:18.7788109' AS DateTime2), N'/uploads/1780327145569_normal (2).jpeg', N'Normal', 23, 13145, N'/uploads/gradcams/1780327176577_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (64, 0.50090170115348043, CAST(N'2026-06-01 22:36:45.9174111' AS DateTime2), N'/uploads/1780328196988_viem-phoi-hit.png', N'Normal', 23, 8836, N'/uploads/gradcams/1780328208486_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (65, 0.99699198531466127, CAST(N'2026-06-01 22:37:09.7889356' AS DateTime2), N'/uploads/1780328227446_pneunomia (3).jpeg', N'Pneumonia', 23, 2318, N'/uploads/gradcams/1780328232457_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (66, 0.99797578027370815, CAST(N'2026-06-01 22:39:47.2789947' AS DateTime2), N'/uploads/1780328384374_normal (2).jpeg', N'Normal', 23, 2859, N'/uploads/gradcams/1780328390571_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (67, 0.99699198531466127, CAST(N'2026-06-01 22:40:50.7698122' AS DateTime2), N'/uploads/1780328448202_pneunomia (3).jpeg', N'Pneumonia', 23, 2544, N'/uploads/gradcams/1780328453719_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (68, 0.99699198531466127, CAST(N'2026-06-01 22:49:12.1709028' AS DateTime2), N'/uploads/1780328949836_pneunomia (3).jpeg', N'Pneumonia', 23, 2311, N'/uploads/gradcams/1780328954327_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (69, 0.99699198531466127, CAST(N'2026-06-01 22:50:07.3828407' AS DateTime2), N'/uploads/1780329005056_pneunomia (3).jpeg', N'Pneumonia', 23, 2304, N'/uploads/gradcams/1780329009622_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (70, 0.99911186529572416, CAST(N'2026-06-01 22:50:48.4084256' AS DateTime2), N'/uploads/1780329044704_pneunomia (3).jpeg', N'Pneumonia', 23, 3680, N'/uploads/gradcams/1780329050530_gradcam.jpg', 2)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (71, 0.98838359117507935, CAST(N'2026-06-01 22:51:06.7122172' AS DateTime2), N'/uploads/1780329061471_pneunomia (3).jpeg', N'Pneumonia', 23, 5101, N'/uploads/gradcams/1780329066743_gradcam.png', NULL)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (72, 0.99911186529572416, CAST(N'2026-06-01 22:51:33.9503037' AS DateTime2), N'/uploads/1780329091013_pneunomia (3).jpeg', N'Pneumonia', 23, 2921, N'/uploads/gradcams/1780329095999_gradcam.jpg', 2)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (73, 0.99699198531466127, CAST(N'2026-06-01 22:51:44.8528761' AS DateTime2), N'/uploads/1780329102623_pneunomia (3).jpeg', N'Pneumonia', 23, 2210, N'/uploads/gradcams/1780329106923_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (74, 0.98838359117507935, CAST(N'2026-06-01 22:52:01.5353869' AS DateTime2), N'/uploads/1780329116535_pneunomia (3).jpeg', N'Pneumonia', 23, 4921, N'/uploads/gradcams/1780329121545_gradcam.png', NULL)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (75, 0.99865849151354935, CAST(N'2026-06-01 23:26:38.9587642' AS DateTime2), N'/uploads/1780331196544_Corona-Virus_05.png', N'Pneumonia', 23, 2401, N'/uploads/gradcams/1780331200518_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (76, 0.98932671546936035, CAST(N'2026-06-01 23:27:07.8002229' AS DateTime2), N'/uploads/1780331223993_images (2).jpg', N'Pneumonia', 23, 3785, N'/uploads/gradcams/1780331227800_gradcam.png', NULL)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (77, 0.998315530756759, CAST(N'2026-06-01 23:27:26.3309646' AS DateTime2), N'/uploads/1780331243664_images (2).jpg', N'Pneumonia', 23, 2654, N'/uploads/gradcams/1780331247846_gradcam.jpg', 2)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (78, 0.98932671546936035, CAST(N'2026-06-01 23:27:47.5044936' AS DateTime2), N'/uploads/1780331263907_images (2).jpg', N'Pneumonia', 23, 3585, N'/uploads/gradcams/1780331267504_gradcam.png', NULL)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (79, 0.67747539281845093, CAST(N'2026-06-01 23:28:11.0464621' AS DateTime2), N'/uploads/1780331288082_724c3f94-x-quang-phoi-binh-thuong-3 (1).jpg', N'Pneumonia', 23, 2943, N'/uploads/gradcams/1780331291047_gradcam.png', NULL)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (80, 0.98268501288178844, CAST(N'2026-06-01 23:28:22.3194013' AS DateTime2), N'/uploads/1780331300062_724c3f94-x-quang-phoi-binh-thuong-3 (1).jpg', N'Pneumonia', 23, 2247, N'/uploads/gradcams/1780331303364_gradcam.jpg', 2)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (81, 0.99410905201738065, CAST(N'2026-06-01 23:28:36.9637813' AS DateTime2), N'/uploads/1780331315248_724c3f94-x-quang-phoi-binh-thuong-3 (1).jpg', N'Normal', 23, 1704, N'/uploads/gradcams/1780331318239_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (82, 0.99699198531466127, CAST(N'2026-06-01 23:29:32.8254506' AS DateTime2), N'/uploads/1780331371179_pneunomia (3).jpeg', N'Pneumonia', 23, 1633, N'/uploads/gradcams/1780331373985_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (83, 0.99911186529572416, CAST(N'2026-06-01 23:29:49.2370572' AS DateTime2), N'/uploads/1780331387094_pneunomia (3).jpeg', N'Pneumonia', 23, 2129, N'/uploads/gradcams/1780331390382_gradcam.jpg', 2)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (84, 0.98838359117507935, CAST(N'2026-06-01 23:54:19.0291069' AS DateTime2), N'/uploads/1780332854415_pneunomia (3).jpeg', N'Pneumonia', 23, 4413, N'/uploads/gradcams/1780332859041_gradcam.png', NULL)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (85, 0.68927178254128907, CAST(N'2026-06-02 00:03:12.5264029' AS DateTime2), N'/uploads/1780333390331_images (2).jpg', N'Pneumonia', 23, 2178, N'/uploads/gradcams/1780333394137_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (86, 0.967089011332418, CAST(N'2026-06-02 01:32:15.9987479' AS DateTime2), N'/uploads/1780338732519_200826-1-2-135626-260820-44.jpg', N'Normal', 23, 3365, N'/uploads/gradcams/1780338738685_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (87, 0.99836118491914871, CAST(N'2026-06-02 01:33:18.2165855' AS DateTime2), N'/uploads/1780338795218_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 2975, N'/uploads/gradcams/1780338800655_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (88, 0.61267650127410889, CAST(N'2026-06-02 10:52:46.6526440' AS DateTime2), N'/uploads/1780372343026_200826-1-2-135626-260820-44.jpg', N'Pneumonia', 23, 23446, N'/uploads/gradcams/1780372366654_gradcam.png', 3)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (89, 0.99836118491914871, CAST(N'2026-06-02 10:53:32.3916482' AS DateTime2), N'/uploads/1780372409940_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 2425, N'/uploads/gradcams/1780372414040_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (90, 0.99836118491914871, CAST(N'2026-06-02 22:49:41.9450325' AS DateTime2), N'/uploads/1780415380083_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 1832, N'/uploads/gradcams/1780415383902_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (91, 0.99836118491914871, CAST(N'2026-06-02 23:08:48.3269812' AS DateTime2), N'/uploads/1780416526534_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 1778, N'/uploads/gradcams/1780416529700_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (92, 0.99836118491914871, CAST(N'2026-06-02 23:09:01.3488782' AS DateTime2), N'/uploads/1780416539609_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 1727, N'/uploads/gradcams/1780416542741_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (93, 0.99836118491914871, CAST(N'2026-06-02 23:11:00.9200126' AS DateTime2), N'/uploads/1780416659009_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 1896, N'/uploads/gradcams/1780416662056_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (94, 0.99836118491914871, CAST(N'2026-06-02 23:17:05.2110614' AS DateTime2), N'/uploads/1780417023266_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 1932, N'/uploads/gradcams/1780417026561_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (95, 0.99836118491914871, CAST(N'2026-06-02 23:19:01.1217277' AS DateTime2), N'/uploads/1780417130512_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 10517, N'/uploads/gradcams/1780417150296_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (96, 0.99836118491914871, CAST(N'2026-06-02 23:19:19.0063996' AS DateTime2), N'/uploads/1780417157082_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 1911, N'/uploads/gradcams/1780417160385_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (97, 0.99836118491914871, CAST(N'2026-06-02 23:30:03.7417603' AS DateTime2), N'/uploads/1780417801609_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 2113, N'/uploads/gradcams/1780417805156_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (98, 0.99836118491914871, CAST(N'2026-06-02 23:37:53.0079480' AS DateTime2), N'/uploads/1780418270906_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 2087, N'/uploads/gradcams/1780418274376_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (99, 0.99836118491914871, CAST(N'2026-06-03 00:18:41.6443694' AS DateTime2), N'/uploads/1780420719715_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 1914, N'/uploads/gradcams/1780420723345_gradcam.jpg', 1)
GO
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (100, 0.99836118491914871, CAST(N'2026-06-03 08:33:22.5746524' AS DateTime2), N'/uploads/1780450387961_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 14408, N'/uploads/gradcams/1780450419356_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (101, 0.99836118491914871, CAST(N'2026-06-03 08:34:10.8915004' AS DateTime2), N'/uploads/1780450447798_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 3071, N'/uploads/gradcams/1780450453147_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (102, 0.99836118491914871, CAST(N'2026-06-03 12:55:17.3527404' AS DateTime2), N'/uploads/1780466106440_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 10726, N'/uploads/gradcams/1780466126819_gradcam.jpg', 1)
INSERT [dbo].[diagnosis_history] ([id], [confidence], [created_at], [image_path], [label], [user_id], [inference_time_ms], [gradcam_path], [model_id]) VALUES (103, 0.99836118491914871, CAST(N'2026-06-03 12:55:39.6392480' AS DateTime2), N'/uploads/1780466137922_200826-1-3-135626-260820-44.jpg', N'Pneumonia', 23, 1704, N'/uploads/gradcams/1780466140957_gradcam.jpg', 1)
SET IDENTITY_INSERT [dbo].[diagnosis_history] OFF
SET IDENTITY_INSERT [dbo].[expert_reviews] ON 

INSERT [dbo].[expert_reviews] ([id], [diagnosis_id], [doctor_id], [final_label], [doctor_comment], [is_used_for_training], [reviewed_at]) VALUES (1, 1, 21, N'Pneumonia', N'nhiều đốm mờ', 0, CAST(N'2026-05-22 12:39:35.7677488' AS DateTime2))
INSERT [dbo].[expert_reviews] ([id], [diagnosis_id], [doctor_id], [final_label], [doctor_comment], [is_used_for_training], [reviewed_at]) VALUES (2, 4, 21, N'Pneumonia', N'viêm phổi', 0, CAST(N'2026-05-22 12:40:47.7154655' AS DateTime2))
INSERT [dbo].[expert_reviews] ([id], [diagnosis_id], [doctor_id], [final_label], [doctor_comment], [is_used_for_training], [reviewed_at]) VALUES (3, 5, 21, N'Normal', N'chẩn đoán ổn', 0, CAST(N'2026-05-22 21:14:20.0030698' AS DateTime2))
INSERT [dbo].[expert_reviews] ([id], [diagnosis_id], [doctor_id], [final_label], [doctor_comment], [is_used_for_training], [reviewed_at]) VALUES (4, 10, 21, N'Pneumonia', N'Viêm phổi', 0, CAST(N'2026-05-22 23:47:42.6926040' AS DateTime2))
INSERT [dbo].[expert_reviews] ([id], [diagnosis_id], [doctor_id], [final_label], [doctor_comment], [is_used_for_training], [reviewed_at]) VALUES (5, 2, 21, N'Pneumonia', N'AI chẩn đoán tốt, ảnh Gradcam cũng khá ổn', 0, CAST(N'2026-06-03 09:10:59.5409339' AS DateTime2))
INSERT [dbo].[expert_reviews] ([id], [diagnosis_id], [doctor_id], [final_label], [doctor_comment], [is_used_for_training], [reviewed_at]) VALUES (6, 3, 21, N'Pneumonia', N'', 0, CAST(N'2026-06-03 10:49:19.4431573' AS DateTime2))
INSERT [dbo].[expert_reviews] ([id], [diagnosis_id], [doctor_id], [final_label], [doctor_comment], [is_used_for_training], [reviewed_at]) VALUES (7, 6, 21, N'Pneumonia', N'Bị bệnh roài', 0, CAST(N'2026-06-03 22:37:21.7384017' AS DateTime2))
SET IDENTITY_INSERT [dbo].[expert_reviews] OFF
SET IDENTITY_INSERT [dbo].[model_metrics] ON 

INSERT [dbo].[model_metrics] ([model_id], [model_name], [accuracy], [precision_score], [recall_score], [f1_score], [auc_score], [expected_runtime_ms], [version], [trained_date], [created_at], [updated_at]) VALUES (1, N'gated_fusion', 0.9423, 0.9381, 0.9718, 0.9547, 0.9325, 15, N'1.0', CAST(N'2026-05-19 09:29:49.540' AS DateTime), CAST(N'2026-05-19 09:29:49.540' AS DateTime), CAST(N'2026-05-19 09:29:49.540' AS DateTime))
INSERT [dbo].[model_metrics] ([model_id], [model_name], [accuracy], [precision_score], [recall_score], [f1_score], [auc_score], [expected_runtime_ms], [version], [trained_date], [created_at], [updated_at]) VALUES (2, N'vit', 0.9263, 0.9257, 0.959, 0.9421, 0.9154, 400, N'1.0', CAST(N'2026-05-19 09:29:49.540' AS DateTime), CAST(N'2026-05-19 09:29:49.540' AS DateTime), CAST(N'2026-05-19 09:29:49.540' AS DateTime))
INSERT [dbo].[model_metrics] ([model_id], [model_name], [accuracy], [precision_score], [recall_score], [f1_score], [auc_score], [expected_runtime_ms], [version], [trained_date], [created_at], [updated_at]) VALUES (3, N'densenet169', 0.8782, 0.8473, 0.9821, 0.9097, 0.8436, 2000, N'1.0', CAST(N'2026-05-19 09:29:49.540' AS DateTime), CAST(N'2026-05-19 09:29:49.540' AS DateTime), CAST(N'2026-05-19 09:29:49.540' AS DateTime))
SET IDENTITY_INSERT [dbo].[model_metrics] OFF
SET IDENTITY_INSERT [dbo].[roles] ON 

INSERT [dbo].[roles] ([id], [name]) VALUES (3, N'ROLE_ADMIN')
INSERT [dbo].[roles] ([id], [name]) VALUES (2, N'ROLE_DOCTOR')
INSERT [dbo].[roles] ([id], [name]) VALUES (1, N'ROLE_USER')
SET IDENTITY_INSERT [dbo].[roles] OFF
SET IDENTITY_INSERT [dbo].[users] ON 

INSERT [dbo].[users] ([id], [username], [email], [password], [role_id], [created_at], [role], [enabled], [address], [full_name], [locked_at], [locked_reason], [phone], [status], [date_of_birth], [gender]) VALUES (21, N'bacsi1', N'bacsi1@gmail.com', N'$2a$10$LbB1rPdnbslTliV.2/I1POt7KriCuFAxQqpAwX3ZcqT0rD4ALN2MS', 2, CAST(N'2026-05-05 10:12:46.873' AS DateTime), N'DOCTOR', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [username], [email], [password], [role_id], [created_at], [role], [enabled], [address], [full_name], [locked_at], [locked_reason], [phone], [status], [date_of_birth], [gender]) VALUES (22, N'admin1', N'123@abcd', N'$2a$10$/.KnPZU0lSb8akAz2KGeKeLcfLYXZcTA9K/MeqNZ7276APaZCysjq', 3, CAST(N'2026-05-07 00:15:43.870' AS DateTime), N'ADMIN', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [username], [email], [password], [role_id], [created_at], [role], [enabled], [address], [full_name], [locked_at], [locked_reason], [phone], [status], [date_of_birth], [gender]) VALUES (23, N'Phong', N'thanhphong1906200491@gmail.com', N'$2a$10$NsuK8MwMUr.XLbcA0x7F6uvvNAmnynurWt22bXdsch4AHz1BHFYvK', 1, CAST(N'2026-05-07 08:30:21.353' AS DateTime), N'PATIENT', 1, N'Huế', N'Nguyễn Thanh Phong', NULL, NULL, N'0868170633', N'ACTIVE', NULL, N'male')
SET IDENTITY_INSERT [dbo].[users] OFF
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__model_me__5DD3F6BBC290E903]    Script Date: 6/4/2026 1:39:44 AM ******/
ALTER TABLE [dbo].[model_metrics] ADD UNIQUE NONCLUSTERED 
(
	[model_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ_model_metrics_model_name]    Script Date: 6/4/2026 1:39:44 AM ******/
ALTER TABLE [dbo].[model_metrics] ADD  CONSTRAINT [UQ_model_metrics_model_name] UNIQUE NONCLUSTERED 
(
	[model_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__roles__72E12F1B3C4D28AE]    Script Date: 6/4/2026 1:39:44 AM ******/
ALTER TABLE [dbo].[roles] ADD UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UK6dotkott2kjsp8vw4d0m25fb7]    Script Date: 6/4/2026 1:39:44 AM ******/
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [UK6dotkott2kjsp8vw4d0m25fb7] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UKr43af9ap4edm43mmtq01oddj6]    Script Date: 6/4/2026 1:39:44 AM ******/
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [UKr43af9ap4edm43mmtq01oddj6] UNIQUE NONCLUSTERED 
(
	[username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__users__AB6E61640F04AEEE]    Script Date: 6/4/2026 1:39:44 AM ******/
ALTER TABLE [dbo].[users] ADD UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__users__F3DBC572A6CA1BFF]    Script Date: 6/4/2026 1:39:44 AM ******/
ALTER TABLE [dbo].[users] ADD UNIQUE NONCLUSTERED 
(
	[username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [dbo].[admin_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[admin_logs]  WITH CHECK ADD FOREIGN KEY([admin_id])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[diagnosis_history]  WITH CHECK ADD  CONSTRAINT [FK_diagnosis_history_model_metrics] FOREIGN KEY([model_id])
REFERENCES [dbo].[model_metrics] ([model_id])
GO
ALTER TABLE [dbo].[diagnosis_history] CHECK CONSTRAINT [FK_diagnosis_history_model_metrics]
GO
ALTER TABLE [dbo].[diagnosis_history]  WITH CHECK ADD  CONSTRAINT [FK7esw66k4l6axkk15tgtt4hmdr] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[diagnosis_history] CHECK CONSTRAINT [FK7esw66k4l6axkk15tgtt4hmdr]
GO
ALTER TABLE [dbo].[expert_reviews]  WITH CHECK ADD  CONSTRAINT [FK_expert_reviews_diagnosis] FOREIGN KEY([diagnosis_id])
REFERENCES [dbo].[diagnosis_history] ([id])
GO
ALTER TABLE [dbo].[expert_reviews] CHECK CONSTRAINT [FK_expert_reviews_diagnosis]
GO
ALTER TABLE [dbo].[expert_reviews]  WITH CHECK ADD  CONSTRAINT [FK_expert_reviews_doctor] FOREIGN KEY([doctor_id])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[expert_reviews] CHECK CONSTRAINT [FK_expert_reviews_doctor]
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD FOREIGN KEY([role_id])
REFERENCES [dbo].[roles] ([id])
GO
