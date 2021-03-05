#ifndef TS_TAG_H
#define TS_TAG_H

#include <stdbool.h>

#include "utils/ekstring.h"
#include "utils/hashmap.h"
#include "utils/vector.h"

static const TagType TAG_TYPES_NOT_ALLOWED_IN_PARAGRAPHS[] = {
    ADDRESS,  ARTICLE,    ASIDE,  BLOCKQUOTE, DETAILS, DIV, DL,
    FIELDSET, FIGCAPTION, FIGURE, FOOTER,     FORM,    H1,  H2,
    H3,       H4,         H5,     H6,         HEADER,  HR,  MAIN,
    NAV,      OL,         P,      PRE,        SECTION,
};
static const unsigned int TTNAIP_LEN =
    sizeof(TAG_TYPES_NOT_ALLOWED_IN_PARAGRAPHS) / sizeof(TagType);

Tag *initTag(za_Allocator *A) {
  Tag *t = (Tag *)za_Alloc(A, sizeof(Tag));
  t->type = END_OF_VOID_TAGS;
  t->custom_tag_name = NaS(A);
  return t;
}
Tag *initTagArgs(za_Allocator *A, TagType type, const ekstring name) {
  Tag *t = (Tag *)za_Alloc(A, sizeof(Tag));
  t->type = type;
  t->custom_tag_name = init_string_string(name);
  return t;
}

bool compareTags(const Tag *a, const Tag *b) {
  if (a == NULL || b == NULL) {
    if (a == NULL && b == NULL)
      return true;
    return false;
  }
  if (a->type != b->type)
    return false;
  if (a->type == CUSTOM &&
      !compare_string_string(a->custom_tag_name, b->custom_tag_name))
    return false;
  return true;
}

inline const bool is_void(Tag *tag) { return tag->type < END_OF_VOID_TAGS; }

const bool findTagType(const TagType *tt, TagType toFind) {
  for (int i = 0; i < TTNAIP_LEN; i++)
    if (tt[i] == toFind)
      return true;
  return false;
}

const bool findTag(vc_vector *v, Tag *tag) {
  for (int i = 0; i < v->count; i++)
    if (compareTags(vc_vector_at(v, i), tag))
      return true;
  return false;
}

inline bool can_contain(const Tag *parent, const Tag *tag) {
  TagType child = tag->type;

  switch (parent->type) {
  case LI:
    return child != LI;
  case DT:
  case DD:
    return child != DT && child != DD;
  case P:
    return !findTagType(TAG_TYPES_NOT_ALLOWED_IN_PARAGRAPHS, tag->type);
  case COLGROUP:
    return child == COL;
  case RB:
  case RT:
  case RP:
    return child != RB && child != RT && child != RP;
  case OPTGROUP:
    return child != OPTGROUP;
  case TR:
    return child != TR;
  case TD:
  case TH:
    return child != TD && child != TH && child != TR;
  default:
    return true;
  }
}

Tag *for_name(za_Allocator *A, struct hashmap_s *m, const ekstring *name) {
  TagType type = hashmap_get(m, name->buf, name->length);
  if (type != 0) {
    Tag *t = (Tag *)za_Alloc(A, sizeof(Tag));
    t->type = type;
    t->custom_tag_name = (ekstring){NULL, 0, A};
    return t;
  } else {
    return initTagArgs(A, CUSTOM, *name);
  }
}

void printTag(Tag *tag) {
  if (tag == NULL)
    printf("(null)\n");
  else {
    if (tag->type == 0)
      printf("{NULL,NULL}");
    else {
#define prTag(x)                                                               \
  case (x):                                                                    \
    printf((#x));                                                              \
    break

      printf("{");
      switch (tag->type) {
        prTag(AREA);
        prTag(BASE);
        prTag(BASEFONT);
        prTag(BGSOUND);
        prTag(BR);
        prTag(COL);
        prTag(COMMAND);
        prTag(EMBED);
        prTag(FRAME);
        prTag(HR);
        prTag(IMAGE);
        prTag(IMG);
        prTag(INPUT);
        prTag(ISINDEX);
        prTag(KEYGEN);
        prTag(LINK);
        prTag(MENUITEM);
        prTag(META);
        prTag(NEXTID);
        prTag(PARAM);
        prTag(SOURCE);
        prTag(TRACK);
        prTag(WBR);
        prTag(END_OF_VOID_TAGS);
        prTag(A);
        prTag(ABBR);
        prTag(ADDRESS);
        prTag(ARTICLE);
        prTag(ASIDE);
        prTag(AUDIO);
        prTag(B);
        prTag(BDI);
        prTag(BDO);
        prTag(BLOCKQUOTE);
        prTag(BODY);
        prTag(BUTTON);
        prTag(CANVAS);
        prTag(CAPTION);
        prTag(CITE);
        prTag(CODE);
        prTag(COLGROUP);
        prTag(DATA);
        prTag(DATALIST);
        prTag(DD);
        prTag(DEL);
        prTag(DETAILS);
        prTag(DFN);
        prTag(DIALOG);
        prTag(DIV);
        prTag(DL);
        prTag(DT);
        prTag(EM);
        prTag(FIELDSET);
        prTag(FIGCAPTION);
        prTag(FIGURE);
        prTag(FOOTER);
        prTag(FORM);
        prTag(H1);
        prTag(H2);
        prTag(H3);
        prTag(H4);
        prTag(H5);
        prTag(H6);
        prTag(HEAD);
        prTag(HEADER);
        prTag(HGROUP);
        prTag(HTML);
        prTag(I);
        prTag(IFRAME);
        prTag(INS);
        prTag(KBD);
        prTag(LABEL);
        prTag(LEGEND);
        prTag(LI);
        prTag(MAIN);
        prTag(MAP);
        prTag(MARK);
        prTag(MATH);
        prTag(MENU);
        prTag(METER);
        prTag(NAV);
        prTag(NOSCRIPT);
        prTag(OBJECT);
        prTag(OL);
        prTag(OPTGROUP);
        prTag(OPTION);
        prTag(OUTPUT);
        prTag(P);
        prTag(PICTURE);
        prTag(PRE);
        prTag(PROGRESS);
        prTag(Q);
        prTag(RB);
        prTag(RP);
        prTag(RT);
        prTag(RTC);
        prTag(RUBY);
        prTag(S);
        prTag(SAMP);
        prTag(SCRIPT);
        prTag(SECTION);
        prTag(SELECT);
        prTag(SLOT);
        prTag(SMALL);
        prTag(SPAN);
        prTag(STRONG);
        prTag(STYLE);
        prTag(SUB);
        prTag(SUMMARY);
        prTag(SUP);
        prTag(SVG);
        prTag(TABLE);
        prTag(TBODY);
        prTag(TD);
        prTag(TEMPLATE);
        prTag(TEXTAREA);
        prTag(TFOOT);
        prTag(TH);
        prTag(THEAD);
        prTag(TIME);
        prTag(TITLE);
        prTag(TR);
        prTag(U);
        prTag(UL);
        prTag(VAR);
        prTag(VIDEO);
        prTag(CUSTOM);
      default:;
      }
      printf(",%s}\n", tag->custom_tag_name.buf);
    }
  }
}

#endif
