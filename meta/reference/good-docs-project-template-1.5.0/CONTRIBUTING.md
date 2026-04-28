# Good Docs Project - Template contributing guide

Welcome to the Good Docs Project. If you're reading this guide, that probably means you'd like to get involved and start contributing to the project. This document should hopefully help you become a full templateer (which is how we refer to the members of our community).

One of the core missions of the Good Docs Project is to provide high-quality documentation templates to open source software projects and beyond. However, we also engage in many other similar initiatives around docs advocacy, docs education, and docs tooling. We value all contributions to the Good Docs Project initiatives, including templates and our other initiatives. The [Join the community](#join-the-community) section of this guide explains how to get involved in those other related initiatives and provides links for more information.

## Table of contents

[TOC]

## What do we work on

The template working groups create or improve templates for a variety of content types used in documentation projects.

Each template project consists of the following required files:

* **Template file** - The raw template for the content type.
* **Template guide** - Provides a deeper explanation of how to fill in the template.
* **Process** - Explains best practices for researching, writing, and maintaining this content type.
* **Resources** - Includes the resources consulted during the research phase of creating the template. Also includes high quality examples of that content type that served as inspiration for the template.
* **Example** - After a template project is complete, our Chronologue working group creates an example of the template. They test the template for overall usability.

See [Template deliverables](template_deliverables.md) for more detailed information about each template deliverable.

### Template packs

A template pack is a collection of templates organized together by:

* Common use cases or tasks
* Needs of particular user personas
* Popular or interesting documentation frameworks
* Maturity models
* Future criteria or needs based on user research and feedback

The core documentation pack is our flagship template pack and it includes the core, fundamental content types that every documentation project needs. If you download one template pack for your project, it should be this one.

From a contribution standpoint, we anticipate that our long-term contributors develop a specialty or area of expertise in some specific template packs over time.

### The Good Docs Project tactic articles

The Good Docs Project takes in requests from users and stakeholders about what types of content they would like us to provide. Sometimes we receive requests for content that doesn't make sense as a template and instead makes more sense as an article or blog entry.

We call these types of articles **tactics** and publish them on our website under a section called [The Good Docs Project tactics](https://www.thegooddocsproject.dev/tactic). Articles written for this framework use the title format {Article Title} Tactic, such as the Docs Landing Page tactic.

Tactic projects go through the same contributing process as templates, but we publish them on our website instead of in the template repository.

### Template issues and boards

All the template and tactics projects that contributors are actively working on or which contributors might work on have a corresponding issue in the templates repository.
Use the issue list or the kanban board to find a project to work on and track your progress as your project moves throughout the template writing phases.

* [Template issues list](https://gitlab.com/tgdp/templates/-/issues)
* [Templates in progress kanban board](https://gitlab.com/tgdp/templates/-/boards/4801048)

## Before you start

Before starting, register for a [Welcome Wagon meeting](https://thegooddocsproject.dev/welcome/). At this 1-hour orientation meeting, you get an introduction to our project's goals, key concepts, and workflows.

We expect all members of our project to be nice to each other and to follow our [Code of Conduct](https://thegooddocsproject.dev/code-of-conduct/) when interacting with other members of the Good Docs Project.

### Time commitment

Most of us participate in one of our working groups, which meet weekly or bi-weekly for 1 hour a week. To contribute templates to a project, all template writers must join one of the template writing working groups. Check our [community calendar](https://thegooddocsproject.dev/community/#calendar) or ask a member of our community for meeting times. We offer two possible template working group meeting times per geolocation (AMER, APAC, EMEA):

* Team Alpaca for AMER and APAC regions
* Team Dolphin for AMER and EMEA regions
* Team Macaw for APAC and EMEA regions

Working at a pace of 1-2 hours a week, most template projects take 6-12 months to complete. Keep in mind that we take what you can give. You and your family come first, then work, then volunteering. So, if something in your life prevents you from working on your project, that's okay. Try to let your working group leader know if you aren't able to continue working for a space of time.

### People who are here to support you

As you work on contributing templates to our project, various resources and members of our community are available to help you along the process. These include:

* **Templateers** - Any individual who contributes to the Good Docs Project (including you!).
* **The template working group leads** - These templateers oversee our overall template development process as a project manager and provide assistance to contributors working on templates. The working group leads also usually review and approve merge requests submitted to the templates repository.
* **Template mentors and buddies** - New templateers are usually assigned a mentor or buddy to provide guidance and mentorship while working on templates.
* **Template peers** - Your fellow templateer peers are available to review templates during the research and community feedback phases. They include members of your template writing working group, but also members from the larger Good Docs Project community.
* **Template editorial team** - This group reviews templates as they're nearing completion to ensure our templates follow best practices for technical writing, have no major organization or structural issues, have no gaps or missing content, and that they're consistent with our style guide.

### Template working group meetings

The template working groups have these types of meetings:

* **Writer's workshops** - At these meetings, each templateer gives an update on their template project and poses a question to the group about some element of their draft they would like feedback and advice about.
* **Co-working sessions** - Templateers meet with their template writing partners, mentors, or buddies to work together on their template projects.
* **Community review sessions** - When a template project is ready for review from the rest of the community, the working group leads schedule a dedicated session for everyone in the group to read and provide feedback about the template files.
* **Planning or retros** - At the beginning of a release cycle, we've a few meetings dedicated to planning our commitments or initiatives for the release cycle. At the end of the release, we always do a working group retrospective to talk about what went well and what we could improve in the next release cycle.

## Definition of done

A template project is complete when:

1. It has progressed through all the [template writing phases](#overview-of-the-template-writing-phasees)
2. It has all the required [template file deliverables](template-deliverables.md).

### Overview of the template writing phases

Contributing a template project to our repository has these phases:

<table>
  <tr>
    <th>#</th>
    <th>Phase</th>
    <th>Your goals</th>
    <th>Definition of done</th>
  </tr>
  <tr>
    <td>1</td>
    <td><a href="#join-the-community">Join the community</a></td>
    <td><ul>
          <li>Join our project by attending a <a href="https://thegooddocsproject.dev/welcome/">Welcome Wagon meeting</a>.</li>
          <li>Decide which working group you'd like to work on based on your interests and experience.</li>
        </ul>
    </td>
    <td>Consider this phase complete when you join a working group.</td>
  </tr>
  <tr>
    <td>2</td>
    <td><a href="#adopt-a-template">Adopt a template</a></td>
    <td><ul>
          <li>Join a template working group.</li>
          <li>Work with a template working group lead and your group to decide which template or tactic project you work on.</li>
          <li>Assign yourself to the corresponding issue for that template or tactic. Note that this requires a <a href="https://gitlab.com/users/sign_up">GitLab account</a> and you need to join the template repository as a member.</li>
          <li>Use the Google Docs attached to that issue to compose the drafts of the template file deliverables.</li>
        </ul>
    </td>
    <td>Consider this phase complete when you assign yourself to the issue tracking your template or tactic project.</td>
  </tr>
  <tr>
    <td>3</td>
    <td><a href="#research-the-template">Research the template</a><br><br>(Research phase)</td>
    <td><ul>
          <li>Research examples and best practices for the content type you're creating a template for.</li>
          <li>Collaborate and get early feedback on your research from your template working group lead and/or other templateers as part of a template writing working group.</li>
        </ul>
    </td>
    <td>Consider this phase complete when you have finished a draft of your <em>Resources</em> document.</td>
  </tr>
  <tr>
    <td>4</td>
    <td><a href="#draft-the-template-deliverables">Draft the template deliverables</a><br><br>(Drafting phase)</td>
    <td><ul>
          <li>Use the Google Docs attached to that issue to create the drafts for the rest of your deliverables in Google Docs: template file, template guide, template process.</li>
          <li>Meet with your working group or writing partners to workshop on and get advice on your drafts while you are working on them.</li>
        </ul>
    </td>
    <td>This phase completes when you schedule your drafts for review by other members of your working group or community.</td>
  </tr>
  <tr>
    <td>5</td>
    <td><a href="#get-feedback-on-drafts-from-the-community">Get feedback on drafts from the community</a><br><br>(Community review phase)</td>
    <td><ul>
          <li>When your template deliverables are ready for review, your working group lead schedules 1-2 sessions in the community where other members of the project review and provide feedback on your template files deliverables.</li>
          <li>Optional: Revise and refine your draft with subject matter experts and individuals beyond our community (such as Write the Docs or subject matter experts).</li>
          <li>After making revisions, work with your template working group to determine when your draft is ready for the next phase.</li>
        </ul>
    </td>
    <td>This phase completes after you incorporate the feedback into your draft and your drafts are ready for a deeper expert review. Ensure you have permission from the working group lead to move to the editorial review phase.</td>
  </tr>
  <tr>
    <td>6</td>
    <td><a href="#get-a-review-from-the-template-editorial-team">Get a review from the template editorial team</a><br><br>(Editorial team review phase)</td>
    <td><ul>
          <li>When your draft is in a state where you feel it's ready, you can work with your working group lead to request an editorial team review. The template editorial team comprises experienced members of the project who review your template project in Google Docs to ensure that it:
            <ul>
              <li>Follows best practices for technical writing.</li>
              <li>Has no major organization or structural issues.</li>
              <li>Has no gaps or missing content.</li>
              <li>Is consistent with our style guide.</li>
            </ul>
          </li>
        </ul>
    </td>
    <td>This phase completes after you incorporate the feedback into your draft and your drafts are in a final state. Ensure you have permission from the working group lead to move to the final review phase.</td>
  </tr>
  <tr>
  <tr>
    <td>7</td>
    <td><a href="#submit-a-merge-request">Submit a merge request</a><br><br>(Final review phase)</td>
    <td><ul>
          <li>Convert drafts from Google Docs to Markdown.</li>
          <li>Convert drafts from Google Docs to Markdown.</li>
          <li>Ensure the Markdown format is clean. NOTE: This project uses EkLine.io to check content and format of Markdown files that you add or modify in the Merge Request.</li>
          <li>Ensure the Markdown renders to HTML correctly.</li>
          <li>Open a merge request against the templates repository. NOTE: You are responsible for educating yourself in how to use Git and GitLab, but you can consult your working group lead and fellow templateers for help.</li>
          <li>Revise documents based on requests from merge request reviewers.</li>
        </ul>
    </td>
    <td>This phase completes when the template merges into the repository.</td>
  </tr>
  <tr>
    <td>8</td>
    <td><a href="#hand-off-to-the-Chronologue-team-for-user-testing">Hand off to the Chronologue team for user testing</a><br><br>(Chronologue phase)</td>
    <td><ul>
          <li>After completing the previous phase, your template is officially part of the Good Docs Project and is available to our users.</li>
          <li>After a template project is complete, our Chronologue working group creates an example of the template. While creating the example, the Chronologue group tests whether your template is user-friendly and can serve a real documentation project. If you're still involved in the community during this phase, these team members might reach out to you for feedback or to collaborate on possible template revisions.</li>
          <li>As additional users try your template out in the wild, they may report usability issues or provide feedback for improvements to the template.</li>
          <li>Either the Chronologue writer, the original template author, or another templateer evaluates feedback and incorporates it into future versions of the template. If extensive revisions arise, the template may need to go through the same previous template writing phases again.</li>
        </ul>
    </td>
    <td>The Chronologue team considers this phase complete when they create an example for the template.</td>
  </tr>
</table>

Each phase has more depth in the remaining sections.

## 1. Join the community

To join our community, you need to register for a [Welcome Wagon meeting](https://thegooddocsproject.dev/welcome/). At this 1-hour orientation meeting, you get:

* A brief overview of our project's goals and mission.
* A bit of information about our community and reasons to consider joining.
* An overview of our key initiatives and working groups that you might consider contributing to.
* An in-depth orientation to one working group of your choice.

After registering for this meeting, you get an email with a link to join our Slack workspace. You are eligible to be a member of our repository after you attend a Welcome Wagon meeting.

To become a full-fledged templateer, you need to join our communication channels so that you can talk to us:

* **Slack** - Our Slack workspace is one of the primary means of communicating with members of our project. After joining our workspace, join the `#welcome` channel to introduce yourself. Consider also joining these Slack channels if you plan to work on a template or tactic project:
  * `#templates`
  * `#ask-a-community-manager`
  * `#tech-requests`
* **Working groups** - We organize our project into several different working groups that meet on a regular basis to work on the project's key initiatives. One of the best ways to get started with our project is to join and meet with one of our working groups. See [The Good Docs Project Working Groups](https://thegooddocsproject.dev/working-groups/) for a list of our current active groups. NOTE: If you plan to contribute to our project by writing templates, you must join one of the template working groups.
* **Weekly meetings** - The project leaders hold weekly meetings to discuss project-level decisions. Feel free to join one of these meetings to introduce yourself to the project leaders and discover next steps for getting involved in the project. See the [community calendar](https://thegooddocsproject.dev/community/#calendar) for meeting times.

As you begin to join our project, remember that this is a project composed entirely of volunteers. We love to welcome new members, but want to be careful not to burn out our core project contributors. This level of mindfulness helps us ensure that we retain our project's capacity to produce high-quality work. As such, we ask that you respect the time of our project maintainers and contributors.
(And expect us to respect your time in return!)

We expect all members of our project to be nice to each other and to follow our [Code of Conduct](https://thegooddocsproject.dev/code-of-conduct/) when interacting with other members of the Good Docs Project.

## 2. Adopt a template

In this phase, you decide which template or tactic project you work on and assign yourself to the issue tracking that project.

Be aware that:

* Each template or tactic project relates to a corresponding issue in the templates repository.
* You use this issue to communicate the status of your template project as it moves through the different phases of the template writing process.
* The Good Docs Project managers use a kanban board that shows all the issues for the current template projects. This tool allows the templateers and project stakeholders to track the overall progress of each template and assist templateers whose progress has stalled.

Links:

* [Template issues list](https://gitlab.com/tgdp/templates/-/issues)
* [Templates in progress kanban board](https://gitlab.com/tgdp/templates/-/boards/4801048)

To adopt a template:

1. Scroll through the list of available template and tactic issues and see if one interests you and/or matches your skill set. Alternatively, if you have an idea for a template or tactic project that doesn't yet have an issue, and you have the support of a template working group lead, you can create a new issue for your project.

2. Assign yourself to the issue. Note that this requires a [GitLab account](https://gitlab.com/users/sign_up). You must attend a [Welcome Wagon meeting](https://thegooddocsproject.dev/welcome/) to become a member of the templates repository. After you've attended that meeting, you can request access in the `#tech-requests` Slack channel.

3. Notify your template working group lead that you have adopted a template project.

If you claim a template or tactic project and later realize that you don't have the time or energy to complete the template project, let your working group lead know.

### Guidelines for choosing a template

Keep in mind that you don't need to be an expert on any content type before you adopt it. If you want to write a particular template or tactic article and you are eager enough to do some research to learn more about it, that's all the preparation you need and we welcome your efforts. Even if you don't have a ton of experience writing a particular type of document, you can still write a high-quality template that is useful to others. With commitment, research, guided mentorship, and feedback from our community, you can and create something that has value to others.

With that in mind, when deciding which template project is right for you, scroll through the list of template issues and ask yourself the following questions:

* Does something about this type of document or template intrigue you, spark your curiosity, and make you excited to research and learn more?
* Do you wish you knew how to create the best version of this type of document? Are you energized by the idea of researching best practices or gleaning insights from subject matter experts about this type of document?
* Do you have experience writing for this type of document which you would like to share? Would having a high quality version of this type of template make your life easier at your workplace or for your open source project?
* Do you feel like there is a strong need for improved versions of this type of document in the world? Do you see lots of bad examples of this document that frustrate you?
* Has the Good Docs Project labeled this type of template as a high priority for our project? (Keep in mind that you can work on any template that you feel enthusiastic about, regardless of priority. That said, we welcome work on our high priority templates.)

If you answered yes to more than one of these questions about a specific type of template, that might be the right template for you to work on.

### Priority levels

The following table explains the priority levels given to different template or tactic projects:

<table>
  <tr>
    <th>Priority</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Critical</td>
    <td><ul>
          <li>A template project that's included in the core template pack. The core template pack is our flagship template pack and the one with the highest visibility and quality.</li>
          <li>A template project or tactic that's in high demand from our users, meaning 10 or more users have requested it.</li>
          <li>Any template work that's blocking other template work or which would improve our overall template processes or usability.</li>
          <li>Any work to get a core template into compliance with our quality standards and/or deliverables.</li>
        </ul>
    </td>
  </tr>
  <tr>
    <td>High</td>
    <td><ul>
          <li>Any template or tactic for which there is high demand from our users, meaning 5-9 users have requested it.</li>
          <li>The project steering committee or template leads have earmarked any template project for a specific release for whatever reason.</li>
          <li>Any work to get a high-demand template or tactic into compliance with our quality standards and/or deliverables.</li>
        </ul>
    </td>
  </tr>
  <tr>
    <td>Medium</td>
    <td><ul>
          <li>Any new template or tactic for which there is moderate demand from users, meaning 2-4 users have requested it.</li>
          <li>Any work the template roadmap adds but isn't earmarked for a specific release.</li>
          <li>Any work to get a moderate-demand template or tactic into compliance with our quality standards and/or deliverables.</li>
        </ul>
    </td>
  </tr>
  <tr>
    <td>Low</td>
    <td><ul>
          <li>Any new template or tactic for which there is low or no demand from users, meaning 1 user has requested it.</li>
          <li>Specialized template projects for a niche audience or area of expertise.</li>
          <li>Any work to get a low-demand template or tactic into compliance with our quality standards and/or deliverables.</li>
        </ul>
    </td>
  </tr>
</table>

## 3. Research the template

Before starting the research phase, read the [Template deliverables](template-deliverables.md) for more detailed information about each template deliverable. Ensure you understand the purpose of each deliverable.

In this phase, you research examples and identify best practices for the type of template you're working on. While you are working on the research phase, you should create a draft for the **resources** template deliverable file. The resources file is where you keep your notes about which resources you consulted and which examples you looked at for guidance.

Our project composes rough draft of templates in Google Docs that the project leads own and maintain. The Good Docs Project owns these files so that we can maintain our project archive and history. With that in mind, the project has pre-generated Google Doc files for you to use as you are researching and drafting your template project. These files include a starting point for the structure of each file that should help you as you draft the documents. Each open issue attaches the pre-generated Google Doc files.

The reasons we require your draft in a Google Doc are because it:

* Is free (no license required) and easy to use.
* Is relatively straightforward to share with collaborators both inside and outside of the Good Docs Project (such as with the Write the Docs community).
* Allows collaborators to give feedback and advice in the form of comments.
* Tracks comment history for later reference.
* Has version control capabilities.

### Recommended research strategies

In our experience, successful templateers usually research their template by:

* **Looking at lots of examples.** Start by searching for examples of that type of document they want to create a template for. The more examples you can look at, the better. While it's better to review good examples of that type of document, there is actually a lot of value in reviewing bad examples too. Consider keeping a spreadsheet to track which examples you used, what elements each one had in common, and what you thought was effective or ineffective.
* **Searching for guides, books, blog posts, conference presentations, or videos about best practices.** Search the Internet to find advice, tips, or expert research about how to create that type of document. Consider posting in a forum for resource ideas. For example, asking for helpful guides or insights on a community forum like the Write the Docs Slack workspace could be beneficial. Be mindful of, and respect copyright terms of source material. Don't plagiarize and offer attribution where appropriate.
* **Reaching out to experts.** When you find people you admire, who have researched your topic already, try reaching out to them. They often have a "how to contact me" webpage. Ask if they'd be okay with using their material. (They might need to republish under a different copyright.) Invite them to participate in the template working group. They might even lead it. If you feel shy about reaching out yourself, your template mentor or senior Good Docs Project member might offer to help.
* **Collaborating with others in a working group.** Work with your template writing working groups to discuss research ideas and findings.

## 4. Draft the template deliverables

After you conclude your research, you create drafts of your template file deliverables in Google Docs. See the [Template deliverables](template-deliverables.md) for more detailed information about each template deliverable.

You can also look at examples of other templates in the repository to see examples of each template file. Be aware that some templates might be missing some files.

Your working group helps you as you work on drafting your templates. At writer's workshop meetings, you can workshop your template by asking for advice or asking questions to get clarification about your template project and content type.

When your draft is in a good place, contact your working group lead to schedule a community review.

## 5. Get feedback on drafts from the community

In this phase, you begin to share your drafts with community reviewers and invite feedback. Optionally, you might also consider sharing it beyond our community with other technical writing communities such as Write the Docs or beyond. The feedback and revision phase is arguably the most crucial and important phase in the template writing process, so your template project might spend the bulk of its time in this phase.

To share your Google Docs drafts:

1. Inside the draft, click the **Share** button and change the **Get Link** settings to: **Anyone on the internet with this link can create comments.**

2. Copy the link to your Google Doc drafts into the issue that corresponds with your template in the templates repository.

3. Notify your working group lead, who helps you schedule a community review session for your template with your working group or another templates working group as needed.

When you've received sufficient community input and incorporated suggestions into your draft, notify your templates working group lead that your draft is ready to move to the next phase.

> :triangular_flag_on_post: **NOTE: You can only move to the next phase (submitting a merge request) after the templates working group lead has approved your draft to move on.**

### Giving feedback to others

See our [Commenting guide for collaborative document reviews](https://gitlab.com/tgdp/governance/-/blob/main/DocCommentingGuide.md?ref_type=heads) for information about how to provide feedback to others.

Also see [Conventional comments](https://conventionalcomments.org/).

### Accepting feedback from others

It's normal to feel nervous about sharing your drafts, especially if you're a new writer or if you don't feel as confident in your subject matter knowledge yet. But your draft can only become the best template it can be if you invite and incorporate high quality feedback into your drafts. Successfully accepting advice on a draft is a key element that distinguishes expert writers from novice writers.

Sharing your work with reviewers:

* Allows you to see your draft with fresh eyes the way a new user would see it.
* Can make you aware of key insights or perspectives that you hadn't yet considered.
* Can help you identify which parts of your draft need more careful thought, attention, and revision.

As you receive feedback, try to give each comment the benefit of the doubt and consider it. Sometimes new writers may react defensively to feedback on their work, but remember that your reviewers have the same goals that you have: to produce a high quality template. But also keep in mind that you don't need to accept every suggestion. If you can make a good argument not to adopt a suggestion, that's important to consider as well.

One other thing that might help you get more high quality reviews is to indicate what kind of feedback you're looking for, based on areas of the draft you think need some improvement. Do you need:

* Global-level feedback, which includes advice on the big picture, general content, tone, clarity, and overall organization or flow of the document?
* Local-level feedback, which includes wordsmithing paragraphs or sentences and polishing up the draft for final revision?

Remember to be positive and show appreciation when people take time to review your drafts. Providing feedback takes time and energy. Treat each piece of feedback as a gift (even feedback that you possibly choose to disregard). Happy editing!

## 6. Get a review from the template editorial team

The purpose of this phase is to ensure your template project meets the standards of the Good Docs Project and is ready for public distribution.

When your draft is in a state where you feel it's ready to get merged in, you can work with your working group lead to request an editorial team review. The template editorial team comprises experienced members of the project who review your template project to ensure that it:

* Follows best practices for technical writing.
* Has no major organization or structural issues.
* Has no gaps or missing content.
* Is consistent with our style guide.

This review aims to be a final quality check to determine whether the template is ready to be officially included in the Good Docs Project.

This phase completes after you incorporate the feedback into your draft and your drafts are in a final state. Ensure you have permission from the working group lead to move to the final review phase.

## 7. Submit a merge request

The purpose of this phase is to check that you format your Markdown correctly, render it correctly, and make it ready for publication. In this phase, you convert your template documents into Markdown and open a merge request in the `templates` repository on GitLab.

If you aren't comfortable working in Markdown, Git, or GitLab, ask your working group lead for advice.

Once you submit a merge request, your template working group lead reviews your template and/or works with other working group leads to review your template. Once the template has at least one approval from a template repository maintainer, it merges into the final project.

## 8. Hand off to the Chronologue team for user testing

Once it passes all reviews, your template merges in and you get a personal acknowledgement in our Slack community and in our next template release notes.

:sparkles: :mega: :raised_hands:

Great documents are never fully done, and there is always room for improvement. After a template project is complete, our Chronologue working group creates an example of the template. While creating the example, the Chronologue group tests whether your template is user-friendly and can support a real documentation project. It's possible that the Chronologue team identifies major or minor revisions that need updating in the template.

If you're still involved in the community during this phase, these team members might reach out to you for feedback or to collaborate on possible template revisions. Either the Chronologue writer, the original template author, or another templateer makes any necessary revisions of the templates. If the template requires extensive revisions, the template goes through the same previous template writing phases again.

After a Chronologue example is complete and users begin to try your template in their own documentation projects, they may report usability issues or provide feedback for improvements to the template. If our project receives this feedback and you're still around to work on your original template, we encourage you to review this feedback and incorporate these revisions into future versions. If you aren't around to continue working on your original template or if you are too busy, we can find a different templateer to respond to user feedback on your behalf.

If a templateer determines that a new version of a template warrants updating, they take the template through the same contributing process starting from the beginning.
