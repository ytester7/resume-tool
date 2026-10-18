import type { ResumeData, SectionId } from '@/types/resume';
import { getSectionLabel } from '@/types/resume';

/**
 * 生成 Word（.docx）简历。
 *
 * 模板的视觉差异无法一比一搬进 Word，这里输出的是「结构清晰、可编辑、
 * 能被国内投递系统解析」的单栏版本，作为 PDF 之外的第二条交付通道。
 */
export async function buildResumeDocx(data: ResumeData, sectionOrder: SectionId[]): Promise<Blob> {
  const {
    AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun,
  } = await import('docx');

  const children: InstanceType<typeof Paragraph>[] = [];
  const push = (p: InstanceType<typeof Paragraph>) => children.push(p);
  const text = (value: string, opts: { bold?: boolean; size?: number; color?: string } = {}) =>
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: value, bold: opts.bold, size: opts.size ?? 21, color: opts.color })],
    });
  const bullet = (value: string) =>
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 40 },
      children: [new TextRun({ text: value, size: 21 })],
    });
  const heading = (value: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: value, bold: true, size: 26, color: '1F4E79' })],
    });

  // 抬头
  push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: data.name || '未命名', bold: true, size: 36 })],
  }));
  if (data.title) {
    push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: data.title, size: 22, color: '555555' })],
    }));
  }

  const contacts = [
    data.phone, data.email, data.age, data.experienceYears ? `${data.experienceYears}经验` : '',
    data.github, data.website,
  ].filter(Boolean);
  if (contacts.length) {
    push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: contacts.join('  |  '), size: 19, color: '666666' })],
    }));
  }

  const intention = [data.jobIntention, data.salary].filter(Boolean).join('  |  ');
  if (intention) {
    push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: intention, size: 19, color: '666666' })],
    }));
  }

  for (const key of sectionOrder) {
    if (key.startsWith('custom:')) {
      const section = data.customSections.find(c => `custom:${c.id}` === key);
      if (!section || (!section.title.trim() && !section.content.trim())) continue;
      push(heading(section.title.trim() || '其他'));
      section.content.split('\n').filter(Boolean).forEach(line => push(text(line)));
      continue;
    }

    switch (key) {
      case 'summary':
        if (!data.summary.trim()) break;
        push(heading(getSectionLabel('summary')));
        data.summary.split('\n').filter(Boolean).forEach(line => push(text(line)));
        break;

      case 'skills':
        if (!data.skills.length) break;
        push(heading(getSectionLabel('skills')));
        for (const skill of data.skills) {
          push(new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${skill.category}：`, bold: true, size: 21 }),
              new TextRun({ text: skill.items, size: 21 }),
              new TextRun({ text: `（${skill.level}）`, size: 19, color: '888888' }),
            ],
          }));
        }
        break;

      case 'experience':
        if (!data.experience.length) break;
        push(heading(getSectionLabel('experience')));
        for (const exp of data.experience) {
          push(new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({ text: exp.company, bold: true, size: 22 }),
              new TextRun({ text: exp.role ? `  ${exp.role}` : '', size: 21 }),
              new TextRun({ text: exp.time ? `    ${exp.time}` : '', size: 19, color: '888888' }),
            ],
          }));
          if (exp.description) push(text(exp.description));
          exp.items.filter(Boolean).forEach(item => push(bullet(item)));
          if (exp.achievement) {
            push(new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({ text: '关键成果：', bold: true, size: 21, color: '1F7A3D' }),
                new TextRun({ text: exp.achievement, size: 21 }),
              ],
            }));
          }
        }
        break;

      case 'projects':
        if (!data.projects.length) break;
        push(heading(getSectionLabel('projects')));
        for (const proj of data.projects) {
          push(new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({ text: proj.name, bold: true, size: 22 }),
              new TextRun({ text: proj.time ? `    ${proj.time}` : '', size: 19, color: '888888' }),
            ],
          }));
          const meta = [proj.role && `角色：${proj.role}`, proj.subtitle].filter(Boolean).join('  |  ');
          if (meta) push(text(meta, { size: 19, color: '666666' }));
          if (proj.background) push(text(proj.background));
          proj.items.filter(Boolean).forEach(item => push(bullet(item)));
          if (proj.achievement) {
            push(new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({ text: '关键成果：', bold: true, size: 21, color: '1F7A3D' }),
                new TextRun({ text: proj.achievement, size: 21 }),
              ],
            }));
          }
        }
        break;

      case 'education':
        if (!data.education.length) break;
        push(heading(getSectionLabel('education')));
        for (const edu of data.education) {
          push(new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: edu.school, bold: true, size: 22 }),
              new TextRun({ text: [edu.major, edu.degree].filter(Boolean).join(' | ') ? `  ${[edu.major, edu.degree].filter(Boolean).join(' | ')}` : '', size: 21 }),
              new TextRun({ text: edu.time ? `    ${edu.time}` : '', size: 19, color: '888888' }),
            ],
          }));
        }
        break;

      case 'evaluation': {
        const lines = data.evaluation.map(e => e.text.trim()).filter(Boolean);
        if (!lines.length) break;
        push(heading(getSectionLabel('evaluation')));
        lines.forEach(line => push(bullet(line)));
        break;
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Microsoft YaHei', size: 21 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 720, bottom: 720, left: 900, right: 900 },
        },
      },
      children,
    }],
  });

  return Packer.toBlob(doc);
}
