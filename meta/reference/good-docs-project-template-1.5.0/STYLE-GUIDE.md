# The Good Docs Project - Style Guide for Documentation of Templates

This brief style guide for Good Docs Templates provides the 20% high-value writing tips which address 80% of the value.
For more comprehensive advice, refer to the Google Developer Style Guide and the Documentation Style Guide for GitLab.

## General recommendations

Apply the  following recommendations as you see fit.

### How to apply the recommendations in this style guide

Each section contains:

* Recommendations: follow these recommendations when writing templates for the Good Docs Project.
If there isn't a recommendation on this style guide, then fall back to one of the parent style guides.
* Checklist: before submitting a merge request, use the checklists to verify your deliverable.
Reviewers use these checklists as criteria to accept or reject an MR.
* Sources:  one of the parent style guides where you can find similar guidance and examples, if at all.

### Write for the audience

When you write, ask the following questions:

* Who am I writing for?
* What assumptions can I make about the audience when I write for them? In other words, what does the audience already know about the subject and what does the audience need to know?
* Can I anticipate questions the audience might have?
* What's the best outcome for the audience? What do I need to say to get this outcome? For example, to use a Good Docs Project template, one needs to download the template file and ideally follow the instructions on the guide of that template.
We want people to use the template and the guide together because of clarity (best outcome) and that's why one can find the following instruction at the top of a guide: "​​{Before using this template, read the accompanying…".

#### Checklist: Does the topic target the audience appropriately?

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>Write for the audience.
   </td>
   <td>Does the template target one or more of the following personas, as defined by the Good Docs Project?
<ul>

<li>Developer-writer

<li>Doc system owner

<li>Reader of end-user documentation based the Good Docs Project templates
</li>
</ul>
   </td>
  </tr>
  <tr>
   <td>Assumptions about the audience
   </td>
   <td>What does the audience already know about the subject and what does the audience need to know?
   </td>
  </tr>
  <tr>
   <td>Try to anticipate questions that the audience might have.
   </td>
   <td>
   </td>
  </tr>
</table>

Sources

* At the time of writing, Google doesn't have any specific guidance.
* At the time of writing, GitLab didn't have any specific guidance.

Please, let us know if there are any updates so we can update this section.
[Contact the Good Docs Project.](mailto:gooddocsproject@gmail.com.)

#### Voice and tone

The current voice and tone of the Good Docs Project projects is mildly casual, serious, but not overly serious, and warm and approachable.
It makes sense to use the same voice and tone when writing templates.

See the diagram for visualizing the voice and tone spectrum for the Good Docs Project.

![alt_text](images/voiceNtone.png "Voice and tone of the Good Docs Project")

Sources

* [Voice and tone | Google developer documentation style guide](https://developers.google.com/style/tone)
* [Tone of voice](https://design.gitlab.com/brand/overview/#tone-of-voice) in the GitLab Design Lab

### Be consistent

Always refer to a feature, a concept, or an object with the same term.
For example, avoid using 'username' and 'user ID' interchangeably, or avoid using 'user' and 'reader', or avoid referring to Microsoft 'Teams' and then refer to 'teams'.

#### Checklist for consistency of terms

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>Always refer to a feature, a concept, or an object with the same term.
   </td>
   <td>Did you always use the same term and the same spelling to refer to the same thing?
   </td>
  </tr>
</table>

Sources

* [Write for a global audience | Google developer documentation style guide](https://developers.google.com/style/translation#be-consistent)
* [Writing for localization | GitLab Documentation Style Guide](https://docs.gitlab.com/ee/development/documentation/styleguide/#writing-for-localization)

### Abbreviations

Spell out an abbreviation in the first occurrence of it on a topic.
Remember that a topic is a self-contained section of a documentation as in DITA topics or a documentation type in Diataxis.
You might have to spell out the same abbreviation across topics of the same documentation because you can't assume that people will have read it on another topic, even if that topic is the 'Getting started' topic.

Exceptions: acronyms that are established in the industry, for example, WWW, TCP/IP, URL, and others.

Avoid creating unnecessary abbreviations.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>In the Getting started pages, use three levels of headings.
      Getting started pages are a great place to start.
   </td>
   <td>In the Getting started (GS) pages, use three levels of headings.
      GS pages are a great place to start.
   </td>
  </tr>
  <tr>
   <td>In The Good Docs Project website, you can find information about the monthly meetings.
    The website doesn't have a search engine.
   </td>
   <td>In The Good Docs Project (TGDP) website, you can find information about the monthly meetings.
TGDP doesn't have a search engine.
   </td>
  </tr>
</table>

#### Checklist for abbreviations

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>Spell out an acronym in the first occurrence of it on a topic.
   </td>
   <td>Make a list of the acronyms that you are using and, on every topic, spell them out in the first occurrence.
   </td>
  </tr>
  <tr>
   <td>Do not spell established acronyms.
   </td>
   <td>Are established acronyms unnecessarily spelled out?
   </td>
  </tr>
</table>

Sources

* [Abbreviations | Google developer documentation style guide](https://developers.google.com/style/abbreviations)
* [Acronyms | GitLab Documentation Style Guide](https://docs.gitlab.com/ee/development/documentation/styleguide/#acronyms)

### Plain language

Plain language means that you write with words that the audience can immediately understand when they read the text the first time.

Apply the following principles.

#### Write short to medium sentences most of the time

In general, short sentences are easier to write and easier to read.
Sometimes, medium sentences are required for complex explanations.
Long sentences might require the reader to read instead of scanning, be mindful and choose long sentences only if absolutely necessary.

Every word must have earned its place in a text.
If you can cut a word because it is not justified in the text, cut it.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>When the process of freeing a vehicle that has been stuck results in ruts or holes, the operator will fill the rut or hole created by such activity before removing the vehicle from the immediate area.
   </td>
   <td>If you make a hole while freeing a stuck vehicle, you must fill the hole before you drive away.
   </td>
  </tr>
</table>

Source of the example: [Wordiness Made Spare article | Plain Language website](https://www.plainlanguage.gov/examples/before-and-after/wordiness).

#### Write in the simplest tense

Typically, the simplest tense is present tense.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>To register a user, configure the system first.
   </td>
   <td>To register a user, you will need to configure the system first.
   </td>
  </tr>
</table>

##### Avoid passive voice when writing instructions

If you want users to perform an instruction, tell them so.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>You must install Docker.
   </td>
   <td>Docker should be installed.
   </td>
  </tr>
  <tr>
   <td>Configure the Oracle instances.
   </td>
   <td>If the Oracle instances haven't been configured yet, then they will need to be.
   </td>
  </tr>
</table>

#### Write for easier translation

Clustering words might be difficult to translate.
Do not cluster more than 3 words.
You can break a cluster of words using prepositions such as 'of', 'for', and 'with'.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>Readme documentation of the Terra service OR Readme of the Terra service
   </td>
   <td>Terra service readme documentation
   </td>
  </tr>
</table>

Don`t use metaphors, figures of speech, slangs, or jargons.

#### Checklist for plain language

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>Write short sentences
   </td>
   <td>Are sentences as short as possible without compromising clarity?
   </td>
  </tr>
  <tr>
   <td>Write in the simplest tense
   </td>
   <td>Are sentences written in the simplest tense possible in the context where they are?
   </td>
  </tr>
  <tr>
   <td>Write for easier translation
   </td>
   <td>Are sentences relatively easy to translate?
   </td>
  </tr>
  <tr>
   <td>Don`t use metaphors, figures of speech, slangs, or jargons.
   </td>
   <td>Are there metaphors, figures of speech, slangs, or jargons?
   </td>
  </tr>
</table>

Sources

* [Write for a global audience | Google developer documentation style guide](https://developers.google.com/style/translation#write-short,-clear,-and-precise-sentences)
* [Writing for localization | Documentation Style GuideGitLab](https://docs.gitlab.com/ee/development/documentation/styleguide/#writing-for-localization)

### Capitalize consistently

 To keep the documentation that you are writing consistent, use capitalization consistently.

Typically, style guides have many rules for capitalization, but to keep this style guide concise, use the following rules:

* Use sentence case for:
  * Titles and headings
  * Lists
  * Table elements like headings, labels, and captions
  * Image legends
* Match the capitalization of the UI when referring to it.
* Check the capitalization of the product that you are writing about and use the same capitalization that the product website uses throughout the document.
If the product or feature that you are writing about is in your project, then define the capitalization and use it consistently.
* Do not use capitalization unnecessarily.
Use 'cloud' instead of 'Cloud', 'service' instead of 'Service', 'project' instead of 'Project', and so on.

#### Checklist for capitalization

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>Sentence case
   </td>
   <td>Did you use sentence case in most cases?
   </td>
  </tr>
  <tr>
   <td>UI
   </td>
   <td>Does the text match the capitalization in the UI?
   </td>
  </tr>
  <tr>
   <td>Product/feature/methodology
   </td>
   <td>Do the product/feature/methodology match the authoritative website about the product/feature/methodology?
   </td>
  </tr>
  <tr>
   <td>Unnecessary capitalization
   </td>
   <td>Did you correct unnecessary capitalization?
   </td>
  </tr>
</table>

Sources

* [Capitalization | GitLab Documentation Style Guide](https://docs.gitlab.com/ee/development/documentation/styleguide/#capitalization)
* [Capitalization | Google developer documentation style guide](https://developers.google.com/style/capitalization)

### Information organization

The most important information comes first in a page, topic, section, or sentence.

![alt_text](images/importance.png "Order of importance")

Source: [https://coolerinsights.com/2021/02/writing-social-media-guide/](https://coolerinsights.com/2021/02/writing-social-media-guide)

When users read the most important information first, you make them focus from the first line.
Users can decide at any point if the topic is not of interest, choose not to read it and still leave with the main message.

Also, since the first sentences appear in search results, it makes sense to have the most important information there because that's what users will see in a list of search results.

So for pages, topics, and sections, put the most important information first, followed by additional details, and then nice-to-know information.
This way of presenting information is also known as inverted pyramid, as depicted in the diagram.

#### How to write sentences with the most important information first

In sentences, information that clears any doubts about the context is as important as the main message.
So, in sentences, put contextual information like goal, location, or condition first.

If these things come at the end of the sentence, there is a great likelihood that users might need to read the text twice: the first time for the meaning of the sentence, and the second time to add the context.

##### Goal

If you are writing about a goal that the user is trying to achieve, then write the goal first.

Example 1: The goal is to request a template.
Users who are not interested in requesting a template can plain skip the text about what's involved in the process of requesting a template.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td><strong>To request a template</strong>, send a request to the TGDP with the document type that needs a template.
    We will assess the document type.
    Depending on the industry needs, we assign it a priority and then add it into the list of templates that need a writer.
   </td>
   <td>The process of requesting a template begins with a request to the TGDP for a template for a document type.
    TGDP's review of this request includes assessment of the industry needs.
    Depending on the demand for the template, we assign a priority to it, and then add it into the list of templates that need a writer.
   </td>
  </tr>
</table>

Example 2: The goal is to edit system-defined metadata of an object.
Users need to know why they are performing instructions before they do.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td><strong>To edit system-defined metadata of an object</strong>:
<p>
1. Sign in to the AWS Management Console and open the Amazon S3 console at <a href="https://console.aws.amazon.com/s3/">https://console.aws.amazon.com/s3/</a>.
<p>
2. Navigate to your Amazon S3 bucket or folder and select the check box to the left of the names of the objects with metadata you want to edit.
   </td>
   <td>1. Sign in to the AWS Management Console and open the Amazon S3 console at <a href="https://console.aws.amazon.com/s3/">https://console.aws.amazon.com/s3/</a>.
<p>
2. Navigate to your Amazon S3 bucket or folder and select the check box to the left of the names of the objects with metadata you want to edit.
<p>
3. Select Save <strong>to save the system-defined metadata of an object.</strong>
   </td>
  </tr>
</table>

##### Location

When you tell users to follow instructions, tell them where this is going to happen.

Example 1:  Tell the user where things happen in the UI.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>1. On the **Actions** menu, choose **Edit** actions, and choose **Edit metadata**.
   </td>
   <td>1. Choose **Edit metadata** on the **Actions** menu> **Edit metadata**.
   </td>
  </tr>
</table>

Example 2:  Tell the user where things happen in the command line.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>1. On your **home directory**, type command.
   </td>
   <td> 1. On the terminal, type command.
   </td>
  </tr>
</table>

##### Condition

If a condition applies to a subset of the audience, write it first, so users to whom the condition doesn't apply can skip the text.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td><strong>For printing color reproductions locally</strong>, use a high-resolution laser or wax-transfer printer that has at least 1MB of memory.
   </td>
   <td><strong>For local PC printing</strong>, it is recommended that you use a high-resolution laser or wax-transfer type printer <strong>for color reproductions</strong>, and that the printer have at least 1 MB of memory.
   </td>
  </tr>
  <tr>
   <td><strong>Unless you have already submitted an up-to-date resume</strong>, you must submit a resume containing your undergraduate, graduate, and any other professional education, your work experience in the field of health care, and the name, address and phone number of current and previous employers in the healthcare field.
   </td>
   <td>With your grant application you must submit a resume containing your undergraduate, graduate, and any other professional education, your work experience in the field of health care, and the name, and phone number of current and previous employers in the healthcare field, <strong>unless you have already submitted this information</strong>.
   </td>
  </tr>
</table>

#### Checklist for information organization

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>Goal comes first in a sentence
   </td>
   <td>Did you make sure that you contextualized sentences based on the goal (if any)?
   </td>
  </tr>
  <tr>
   <td>Location comes first in a sentence
   </td>
   <td>Did you make sure users know where to find the information in the UI?
   </td>
  </tr>
  <tr>
   <td>Condition comes first in a sentence
   </td>
   <td>Did you make sure that conditions came first (if any)?
   </td>
  </tr>
  <tr>
   <td>Most important information comes first
   </td>
   <td>Did you make sure that you placed the most important information first in the topic, section, or page?
   </td>
  </tr>
</table>

Sources

* [Sentence structure | Google developer documentation style guide](https://developers.google.com/style/sentence-structure)
* [Procedures | Google developer documentation style guide](https://developers.google.com/style/procedures#introductory-sentences)
* GitLab N/A

### Links

A helpful link is up to date, not broken, it empowers users to choose to follow it BEFORE they do, and is placed where it is needed and not where it can become a distraction.

#### How to write up-to-date links

When linking to another topic, whenever possible and in particular to an external site, use a low-risk link or a medium-risk link.
These links have a lower risk of being outdated or broken than linking directly to an internal document in an external site.
This is particularly important in The Good Docs Project documentation, where writers are volunteers and might not be around when the link needs updating.

The following table explains the types of links and the risk of the link to be outdated or broken, how to write that type of link, and an example for each type of link.

<table>
  <tr>
   <td>Risk
   </td>
   <td>How to write
   </td>
   <td>Example
   </td>
  </tr>
  <tr>
   <td>Low risk
   </td>
   <td>Do not hyperlink, but explain how to find the information.
   </td>
   <td>To read about how to register an app with Firebase, go to the Firebase website and search for 'register app Firebase'.
   </td>
  </tr>
  <tr>
   <td>Medium risk
   </td>
   <td>Hyperlink to the website, and explain how to search for the information.
   </td>
   <td>To read about how to register an app with Firebase, go to `Firebase https://firebase.google.com/`_ and search for 'register app Firebase'.
   </td>
  </tr>
  <tr>
   <td>High risk
   </td>
   <td>Hyperlink to a specific topic
   </td>
   <td>To read about how to register an app with Firebase, go to `Add Firebase to your Apple project https://firebase.google.com/docs/ios/setup#register-app`_.
   </td>
  </tr>
</table>

When you write the resources deliverable for the template project, try to use medium-risk links, when possible.

When linking to internal topics, it is less problematic to use high risk links than when linking externally.
That is because the likelihood that internally changed links will be updated or noticed early is higher than when a link changes externally.
For example, you can use a link to a template deliverable of a Good Docs Project template.
See the
[resources section](#resources) of the template deliverables.

#### Accessed on

With each external link, Give the reader an indication of when you accessed the link:

Accessed on _date on which the link was accessed_.

#### How users can choose to follow the link before they do

When creating links, unless the link text is self-explanatory, create links with context.
Tell people why they'd follow a link before they click on it by adding introductory information with the link.
It is just a small sentence for you, but it saves people the trouble of following the link and scanning the page to find out why the link is there and if they did want to read the page.

You can add context to links using the following ways:

* Write a descriptive phrase that provides context for the topic that you're linking to.
* Write link text that portraits the content of the topic that you're linking to.
Ideally, the link text would match the topic heading on the target page.

See some examples of not so helpful links and how to fix them.

<table>
  <tr>
   <td>Not so helpful link
   </td>
   <td>Problem
   </td>
   <td>Solution
   </td>
   <td>Helpful link
   </td>
  </tr>
  <tr>
   <td>For more information, see this link. https://sublime-and-sphinx-guide.readthedocs.io/en/latest/references.html#add-links`_ OR
<p>
       For more information, `click here. https://sublime-and-sphinx-guide.readthedocs.io/en/latest/references.html#add-links`_x
   </td>
   <td>'this link' or 'click here' don't have any context and don't help users figure out what the topic is about.
   </td>
   <td>Rewrite the link text so that it tells users what the topic is about.
   </td>
   <td>For more information about adding links in Sphinx, see `Add links. https://sublime-and-sphinx-guide.readthedocs.io/en/latest/references.html#add-links`
   </td>
  </tr>
  <tr>
   <td>Read the Before Installing or Upgrading documentation before installing or upgrading.
   </td>
   <td>If there are multiple products, documentation of which one?
   </td>
   <td>Whenever there is more than one possibility, be specific about which documentation the link displays.
   </td>
   <td>Before installing or upgrading the NetApp Kubernetes Monitoring Operator, read the <strong><a href="https://docs.netapp.com/pre-requisites_for_k8s_operator.html">Before Installing or Upgrading</a></strong> documentation.
   </td>
  </tr>
</table>

Sources

* [Link text | Google developer documentation style guide](https://developers.google.com/style/link-text)
* GitLab has examples of standard text for commonly used link texts: [Standard text in links | GitLab Documentation Style Guide](https://docs.gitlab.com/ee/development/documentation/styleguide/#standard-text)

#### Where to place a hyperlink

Links can be distracting, especially if placed in places where people don't need them.

* For instructions that the user must follow to complete a step, place the link in the step where it is needed.
* For supporting information, create a section called 'Related topics' at the bottom of the page and place links with supporting information, related topics, and nice-to-know information in there.

Source

* [Links | GitLab Documentation Style Guide](https://docs.gitlab.com/ee/development/documentation/styleguide/#links)
* At the time of writing, Google didn't have any guidance about where to place links.
Lots of recommendations about writing links.

#### Checklist for links

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>If possible, use low-risk links for external documentation.
   </td>
   <td>Did you choose low-risk or medium risk, over high risk links whenever possible?
   </td>
  </tr>
  <tr>
   <td>Help users to decide to follow the link or not, before they do
   </td>
   <td>Did you help users to choose to follow links or not by either by adding an introductory sentence or by writing a helpful link text?
   </td>
  </tr>
  <tr>
   <td>Accessed on
   </td>
   <td>Did you provide the date you accessed the link?
   </td>
  </tr>
  <tr>
   <td>Place the link where it is helpful and not a distraction
   </td>
   <td>Did you place essential links next to the text where it is needed? Did you place links with supporting information in a section for related information?
   </td>
  </tr>
</table>

### Lists

The simplest guideline for lists is: use numbered lists for a sequence of instructions or anything that requires order.
Use bulleted lists for everything else.

Other recommendations:

* Introduce the list with an introductory sentence.
* Use parallel phrasing.
* For inline lists, use the Oxford comma.

#### Introductory sentence

To clear any assumptions about the content of the list, write a complete sentence to introduce the list.

Example 1: No introductory sentence X introductory sentence

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>Administrators can manage VMs with the following features:
<ul>

<li>Super VM

<li>VM center

<li>VM Advantage

<p>
Proposals limitations
<p>
Consider the following limitations for proposal description and active proposals at a time:
<ul>

<li>There is a character limit of 20,000 for the description of a proposal.

<li>One address can have a maximum of 10 active proposals at a time, across multiple spaces.
</li>
</ul>
</li>
</ul>
   </td>
   <td>Enable administrators to deal with VMs with the following features:
<ul>

<li>Super VM

<li>VM center

<li>VM Advantage

<p>
Proposals limitations
<ul>

<li>There is a character limit of 20,000 for the description of a proposal.

<li>One address can have a maximum of 10 active proposals at a time, across multiple spaces.
</li>
</ul>
</li>
</ul>
   </td>
  </tr>
</table>

Example 2: A clear introductory sentence X Not so clear introductory sentence

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>Administrators can manage VMs with the following features:
<ul>

<li>Super VM

<li>VM center

<li>VM Advantage
</li>
</ul>
   </td>
   <td>Enable administrators to deal with VMs with the following features:
<ul>

<li>Super VM

<li>VM center

<li>VM Advantage
</li>
</ul>
   </td>
  </tr>
</table>

#### Numbered lists

Use numbered lists for instructions or anything that requires order.

Example 1:  Numbered list for instructions

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>
<ol>

<li>On the bottom of the **Fields List** pane on the left, click **Add a Field**.
       2. Search your field by address, zip code, latitude/longitude, or CLUs (common land units) that appear as outlined grids of land.
<p>
       3. To organize your field information in your account, type a **Field Name**, **Client Name**, **Farm Name** and **Approximate Area** of the field.
<p>

</li>
</ol>
   </td>
   <td>
<ul>

<li>Click **Add a Field** on the bottom of the **Fields List** pane on the left.

<li>Search your field by address, zip code or latitude/longitude or by CLUs (common land units) that will appear as outlined grids of land.

<li>Provide a **Field Name**, **Client Name**, **Farm Name** and **Approximate Area** of the field in order to keep your field information organized in your account.
</li>
</ul>
   </td>
  </tr>
</table>

#### Bulleted lists

When the order of the items of a list is interchangeable, use a bulleted list.

Example 1:  Bulleted list for a series of items that can be listed in any order

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>The retention policy is the following:
<ul>

<li>Slack - 30 days for Chat, 4yrs for channels, 4yrs for files

<li>Gmail attachments - 2yrs for active accounts, 6mths for non-active accounts
</li>
</ul>
   </td>
   <td>The retention policy is the following:
<p>
1. Slack - 30 days for Chat, 4yrs for channels, 4yrs for files
<p>
2. Gmail attachments - 2yrs for active accounts, 6mths for non-active accounts
   </td>
  </tr>
</table>

#### Inline lists

When you want to write inline lists with 3 or more items, use the Oxford comma.

Example 1: Use the Oxford comma when you want to list 3 or more items in a list.

<table>
  <tr>
   <td>2 items in a list
   </td>
   <td>3 items in a list
   </td>
  </tr>
  <tr>
   <td>Turn the system on. Press a, b and c.
   </td>
   <td>Turn the system on. Press a, b, and c.
   </td>
  </tr>
</table>

### Parallel phrasing

Use the same syntax or structure for list items.

<table>
  <tr>
   <td>Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>Things I should eat:
<ul>

<li>Vegetables

<li>Beans

<li>Fruits
</li>
</ul>
   </td>
   <td>Things that I eat:
<ul>

<li>I eat chocolate.

<li>Nutella

<li>The other day I also ate ice cream.

<li>Cheesecake is great!
</li>
</ul>
   </td>
  </tr>
</table>

#### Checklist for lists

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>Write an introductory sentence
   </td>
   <td>Does the list have an introductory sentence?
   </td>
  </tr>
  <tr>
   <td>Use numbered lists when the order is important
   </td>
   <td>Is the numbered list wrong if the items are listed out of the current order?
   </td>
  </tr>
  <tr>
   <td>Use bullet lists for non-ordered items
   </td>
   <td>Can the items be listed in any order?
   </td>
  </tr>
  <tr>
   <td>Use oxford comma
   </td>
   <td>Does the inline list have three or more items?
   </td>
  </tr>
  <tr>
   <td>Use parallel phrasing
   </td>
   <td>Does the list present the same structure for all items?
   </td>
  </tr>
</table>

### Tables

Markdown tables work best for simple tables.
Because of the many limitations that Markdown tables have for complex tables, prefer bullet lists over tables whenever possible.

Use a table in the following cases:

* The information consists of two or more parts whose relationship is best captured in a table.
* The tabular format brings out or highlights information in such a way that lists can't capture.
* The table saves a lot of words because there is a clear pattern established by the table that avoids repeating words.

#### Introductory sentence

Just like with lists, to clear any assumptions about the content of the table, write a complete sentence to introduce the table, unless the table comes right after a heading and the heading is sufficiently descriptive.
For example, the checklist tables in this document.

#### Table header

Tables must have a header.
Use sentence style to capitalize the header.

#### Checklist for tables

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>Use a list whenever possible
   </td>
   <td>Can the table be written as a list?
   </td>
  </tr>
  <tr>
   <td>Use a table for two or more parts of information
   </td>
   <td>Does the table contain two or more parts?
   </td>
  </tr>
  <tr>
   <td>Use a table to bring out more information
   </td>
   <td>Does the table bring out information?
   </td>
  </tr>
  <tr>
   <td>Use a table to save repeating words
   </td>
   <td>Does the table save words significantly?
   </td>
  </tr>
  <tr>
   <td>Write an introductory sentence
   </td>
   <td>Does the table have an introductory sentence?
   </td>
  </tr>
  <tr>
   <td>Add a table header
   </td>
   <td>Does the table have a header?
   </td>
  </tr>
</table>

### Notes

Use notes sparingly.
Too many and the topic becomes crowded.
A rough guide is one note per topic.

Put notes where users are likely to see them or when users are likely to need them.

### Where to place notes

* Right before an instruction or a text where the note applies, not after.
* Before tables, images, or graphs.
* At the beginning of a section or topic, not after.

<table>
  <tr>
   <td>
Do
   </td>
   <td>Don't
   </td>
  </tr>
  <tr>
   <td>To edit system-defined metadata of an object:
<p>
<strong>Tip: Use your TGDP credentials.</strong>
<p>
1. Sign in to the AWS Management Console and open the Amazon S3 console at <a href="https://console.aws.amazon.com/s3/">https://console.aws.amazon.com/s3/</a>.
<p>
2. Navigate to your Amazon S3 bucket or folder and select the check box to the left of the names of the objects with metadata you want to edit.
   </td>
   <td>1. Sign in to the AWS Management Console and open the Amazon S3 console at <a href="https://console.aws.amazon.com/s3/">https://console.aws.amazon.com/s3/</a>.
<p>
2. Navigate to your Amazon S3 bucket or folder and select the check box to the left of the names of the objects with metadata you want to edit.
<p>
3. Select **Save** to save the system-defined metadata of an object.
<p>
<strong>Tip: Use your TGDP credentials.</strong>
   </td>
  </tr>
</table>

#### Types of notes

Use the following list to add notes, ordered by from least important to most important:

* Tip: Information that might help a user.
* Caution: Crucial information, proceed with caution.
* Warning:  Negative consequences of an action, including data loss.

Guidance for notes in template guides: {ALL CAPS: tip}  can be deleted by the users of the template when they fill in the template.

#### Checklist for notes

<table>
  <tr>
   <td>Guideline
   </td>
   <td>Check
   </td>
  </tr>
  <tr>
   <td>Use notes sparingly
   </td>
   <td>Does the topic have more than one note?
   </td>
  </tr>
  <tr>
   <td>Place notes when users need them
   </td>
   <td>Is the information in the note something users need to see before they read the text that comes after the note?
   </td>
  </tr>
  <tr>
   <td>Place notes when users need them
   </td>
   <td>Is the note placed before a table, a section, an image, or a chart?
   </td>
  </tr>
</table>

Sources

* [Notes | Google developer documentation style guide](https://developers.google.com/style/notices)
* [Note | GitLab Documentation Style Guide](https://docs.gitlab.com/ee/development/documentation/styleguide/#note)

Add some guidance for the verb form to use in specific topics - Google has it.

## Structure and information organization

The structure of a template has two parts: one that depends on the specific subject of the template and can differ from template to template, and one that adheres to the Good Docs Project that is common to all templates.
The structure provided by the Good Docs Project consists of boilerplates and template deliverables.

## Template deliverables

This section explains file deliverables that template authors need to write as part of each template project.
To understand the larger context for these deliverables, see[Template Contributing Guide](https://gitlab.com/tgdp/templates/-/blob/main/CONTRIBUTING.md).

### Purpose and use case of each deliverable

Currently, for a template project to be considered complete, each template project must have these file deliverables:

<table>
  <tr>
   <td><strong>Deliverable</strong>
   </td>
   <td><strong>Naming convention for the filename and purpose of the file</strong>
   </td>
   <td><strong>Use case</strong>
   </td>
  </tr>
  <tr>
   <td>Template
   </td>
   <td><strong>template_<em>content-type</em>.md</strong>
<p>
The template file is the raw template for the content type.
It provides a rough outline of the suggested content and a few embedded writing tips for how to fill in the different sections of the template.
   </td>
   <td>Used by<a href="https://tinyurl.com/tgdp-personas"> Developer-Writer Darby</a> to create better documentation.
<p>
"Just give me something easy I can fill out and nothing more!"
   </td>
  </tr>
  <tr>
   <td>Template guide
   </td>
   <td><strong>guide_<em>content-type</em>.md</strong>
<p>
This guide provides a deeper explanation of how to fill in the template.
It provides a lightweight introduction to the purpose of this documentation and explains how to fill in each section of the document.
Any information that is essential to filling out the template should be noted in this guide.
   </td>
   <td>Used by<a href="https://tinyurl.com/tgdp-personas"> Developer-Writer Darby</a> to fill in the template.
<p>
"When I get stuck, I'll refer to the guide to help me out.
Keep this guide simple and lightweight for me!"
   </td>
  </tr>
  <tr>
   <td>Resources
   </td>
   <td><strong>resources_<em>content-type</em>.md</strong>
<p>
This document includes the resources (books, blog entries, guides) that the templateer used during the research phase of creating the template.
The templateer can also include high quality examples of that content type that served as inspiration for the template.
Template contributors should use this document to ethically cite their sources and give credit where credit is due, in harmony with our Code of Conduct.
   </td>
   <td>Used by<a href="https://tinyurl.com/tgdp-personas"> Templateer Terry</a> to ethically cite sources.
Also used by<a href="https://tinyurl.com/tgdp-personas"> Doc System Owner Olly</a> to understand the theory that informs this template on a deeper level.
<p>
"If I want to customize this template for my project, I can use this document to make informed changes.
If I need to maintain this template and make changes to it in the future, I can understand the thinking that went into the template originally."
   </td>
  </tr>
  <tr>
   <td>Process
   </td>
   <td><strong>process_<em>content-type</em>.md</strong>
<p>
This document explains best practices for researching, writing, and maintaining this content type.
As a minimum viable document, it can be very lightweight and include simple content about researching, writing, and maintaining that content type---such as a paragraph each.
If a more detailed explanation is needed for that content type, it can go deeper.
   </td>
   <td>Used by<a href="https://tinyurl.com/tgdp-personas"> Developer-Writer Darby</a> and<a href="https://tinyurl.com/tgdp-personas"> Doc System Owner Olly</a> to learn about any unique challenges or best practices when writing this content type.
<p>
"Help me understand best practices and avoid common mistakes."
   </td>
  </tr>
  <tr>
   <td>Example
   </td>
   <td><strong>example_<em>content-type</em>.md</strong>
<p>
After a template project is complete, our Chronologue working group will create an example of the template.
While creating the example, the Chronologue group will test whether your template is user-friendly and can be used in a real documentation project.
If you're still involved in the community during this phase, these team members might reach out to you for feedback or to collaborate on possible template revisions.
NOTE: Examples are required, but they are created after the template writing process.
   </td>
   <td>Used by<a href="https://tinyurl.com/tgdp-personas"> Developer-Writer Darby</a> and<a href="https://tinyurl.com/tgdp-personas"> Doc System Owner Olly</a> to see what this content type looks like in a practical context.
<p>
"Help me see an example of this template in action so that I can see what 'good enough' looks like."
   </td>
  </tr>
</table>

Each template deliverable is explained in the following sections.

### Template file

Naming convention: template\__content-type_.md

where:

* template is a constant.
* _content-type_ is the specific subject that the template is about, for example, template_memo.md is a template for memos.

The template file is the basic template for the type of document you are creating.
It provides a rough outline of the suggested content and a few embedded writing tips for how to fill in the different sections of the template.
The template user will copy this template and begin filling it in or editing it as their starting point in the writing process.

#### Content and formatting guidelines

Each template must have this content:

* **The template title** - The type of document this template is for.
For example, "Tutorial template" or "README template."" This title must be formatted with the heading 1 weight.
* **Introductory comment** - Include an embedded writing tip at the start that tells users they should first read the accompanying template guide before they fill in the template.
Put introductory comments in {curly brackets}.
* **The template sections** - Each section of the template should begin with a heading with the heading 2 weight.
The recommended content and some embedded writing tips fall under the headings.
* **Embedded writing tips** - You can provide some lightweight writing tips that provide some tips or hints about what kind of content the template user might choose to put in a section of the document.
Put embedded writing tips in {curly brackets}.

🚩 **NOTE: The basic content of the template depends on the type of document you are creating a template for.
Different types of documents can have widely varying content needs.
While similar document types are likely to require similar structures, other document types may be structured quite differently.**

#### Frequently asked questions

**Q: Is it better to include all the possible sections that someone could possibly include in the template file or should it just have the most common sections?**

A: While this is mostly a judgment call on your part as the template author, it might be better to err on the side of being comprehensive.
Don't forget that in your template guide you can indicate whether it is common or recommended to include this section or not.

**Q: Can I use heading 3 weights for sub-sections?**

A: Yes, but try not to go much deeper than level 3.

### Template guide

Naming convention: guide\__content-type_.md

where:

* guide is a constant.
* _content-type_ is the specific subject that the template is about, for example, guide_memo.md is the guide for the memo template.

The guide provides a deeper explanation of how to fill in each section of the template.
This guide explains the key decisions that the template user needs to make during the writing process.

The guide might also optionally include a checklist of the required components for this type of document.

#### Content and formatting guidelines

The template guide must follow the same basic structure:

* **Template guide title** - The type of document this template is for and the words "guide." For example, "Tutorial guide" or "README guide." This title must be formatted with the heading 1 weight.
* **Introductory comment** - Include an embedded writing tip at the start that tells users they should first read this guide before they fill in the template.
This comment could also mention how to get the template file.
Put introductory comments in {curly brackets}.
* **Why do I need this type of document?** - Provide some of the information about the purpose of this type of document and how it helps your documentation project.
The header for this section should be formatted with the heading 2 weight.
* **Content of this template** - This header marks the beginning of the part of the guide that explains how to fill in each section of the guide.
It should be formatted with the heading 2 weight.
* **About the {insert section name here} section** - Next, include each section as they appear in the template with the heading 3 weight.
For example, if your template includes a "Before you start" section, this heading should say "About the before your start section." And then it should provide guidance about what kind of content goes in that section and why that section might be included in the final document.
If the section is optional, indicate why some documents could benefit from that section or why it might be left out.
If the template user needs to make a decision about the content in that section, provide guidance about what should go into that section.

### Resources

Naming convention: resources\__content-type_.md

Where:

* resources is a constant.
* _content-type_ is the specific subject that the template is about, for example, resources_memo.md is the resource file for the memo template.

This document includes the resources (books, blog entries, guides) that the templateer used during the research phase of creating the template.
The templateer can also include high quality examples of that content type that served as inspiration for the template.

Template contributors should use this document to ethically cite their sources and give credit where credit is due, in harmony with our Code of Conduct.

The resources file has a number of advantages:

<table>
  <tr>
   <td><strong>For the project</strong>
   </td>
   <td>It gives The Good Docs Project a way to ethically cite our sources and give credit where credit is due.
   </td>
  </tr>
  <tr>
   <td><strong>For the template contributor</strong>
   </td>
   <td>It gives them a starting point and ending point (a goal + a final deliverable) for the research phase.
   </td>
  </tr>
  <tr>
   <td><strong>For template readers who choose to read the process document</strong>
   </td>
   <td>It explains the theory behind why certain decisions were made to the template, which can help them understand why the template author made certain design decisions.
It can also help them know how they can customize the template to their organization's needs.
   </td>
  </tr>
  <tr>
   <td><strong>Future template maintainers</strong>
   </td>
   <td>This document helps them understand why a template was developed a certain way.
It will help them decide whether to change the template in the future (or not).
   </td>
  </tr>
</table>

#### Content and formatting guidelines

Each resource file must have the following sections:

* **Template title resources** - The type of document this template is for + "resources".
For example, "Tutorial resources" or "README resources." This title should be formatted with the heading 1 weight.
* **Sources consulted** - Include a bulleted list or table of the sources you consulted while researching this template.
Include a link and/or full citation so that others can find it.
Explain how that source influenced the design decisions in your template.
* **Examples** - Include a bulleted list or table of the examples that served as inspiration for your template.
Include a link and/or full citation so that others can find it.

### Process

Naming convention: resources\__content-type_.md

where:

* process is a constant.
* _content-type_ is the specific subject that the template is about, for example, process_memo.md is the process file for the memo template.

This document explains best practices for researching, writing, and maintaining this content type.
It can be very lightweight and include simple content about researching, writing, and maintaining that content type---such as a paragraph each.
If a more detailed explanation is needed for that content type, it can go deeper.

#### Content and formatting guidelines

Each resource file must have the following sections:

* **Template title process** - The type of document this template is for + "process".
For example, "Tutorial process" or "README process." This title must be formatted with the heading 1 weight.
* **Researching _content-type_** - Explain best practices for researching this content type.
* **Writing _content-type_** - Explain recommendations for writing this content type.
* **Maintaining _content-type_** - Explain best practices for maintaining this content type over time, such as evaluating its effectiveness and keeping it up to date.
It can also include knowing when to archive that content type if appropriate.

### Template example (optional)

Naming convention: example\__content-type_.md

where:

* example is a constant.
* _content-type_ is the specific subject that the template is about, for example, example_memo.md is an example file for the memo template.

After a template project is complete, our Chronologue working group will create an example of the template.
While creating the example, the Chronologue group will test whether your template is user-friendly and can be used in a real documentation project.
If you're still involved in the community during this phase, these team members might reach out to you for feedback or to collaborate on possible template revisions.

## Format

To write templates and deliverables, use Markdown.
Suggested guide for Markdown: [Markdown Guide](https://www.markdownguide.org).

## Related topics

Accessed on March, 3rd, 2024:

* [Google Developer Style Guide](https://developers.google.com/style)
* [GitLab Documentation Style Guide](https://docs.gitlab.com/ee/development/documentation/styleguide)
* [Docs for Developers, Chapter 1 Understand your audience](https://docsfordevelopers.com).
* To help you define the audience, see the Google Technical Writing course, [Audience](https://developers.google.com/tech-writing/one/audience).
* For information about DITA topics, see [DITA topics](https://developers.google.com/tech-writing/one/audience).
* For information about plain language, see [Plain language](https://www.plainlanguage.gov).
