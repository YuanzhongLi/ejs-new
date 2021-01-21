.PHONY: check clean

######################################################

ifeq ($(EJSVM_DIR),)
    EJSVM_DIR=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))
endif

######################################################
# default values

ifeq ($(CC),cc)
    CC = clang
endif
ifeq ($(CXX),cc)
    CC = clang
endif
ifeq ($(SED),)
    SED = gsed
endif
ifeq ($(PYTHON),)
    PYTHON = python
endif
ifeq ($(CPP_VMDL),)
    CPP_VMDL=$(CC) $(CPPFLAGS) -E -x c -P
endif
ifeq ($(COCCINELLE),)
    COCCINELLE = spatch
endif
ifeq ($(OPT_GC),)
# GC=native|boehmgc|none
    OPT_GC=native
endif
#ifeq ($(SUPERINSNSPEC),)
#    SUPERINSNSPEC=none
#endif
#ifeq ($(SUPERINSNTYPE),)
#    SUPERINSNTYPE=4
#endif
ifeq ($(OPT_REGEXP),)
# REGEXP=oniguruma|none
    OPT_REGEXP=none
endif

######################################################
# commands and paths

ifeq ($(SUPERINSNTYPE),)
GOTTA=$(PYTHON) $(EJSVM_DIR)/gotta.py\
    --otspec $(OPERANDSPEC)\
    --insndef $(EJSVM_DIR)/instructions.def
else
GOTTA=$(PYTHON) $(EJSVM_DIR)/gotta.py\
    --sispec $(SUPERINSNSPEC)\
    --otspec $(OPERANDSPEC)\
    --insndef $(EJSVM_DIR)/instructions.def\
    --sitype $(SUPERINSNTYPE)
endif

#SILIST=$(GOTTA) --silist --sispec
SILIST=$(SED) -e 's/^.*: *//'

EJSC_DIR=$(EJSVM_DIR)/../ejsc
EJSC=$(EJSC_DIR)/newejsc.jar

VMGEN_DIR=$(EJSVM_DIR)/../vmgen
VMGEN=$(VMGEN_DIR)/vmgen.jar

VMDL_DIR=$(EJSVM_DIR)/../vmdl
VMDL=$(VMDL_DIR)/vmdlc.jar
VMDL_WORKSPACE=vmdl_workspace
VMDL_INLINE=$(VMDL_WORKSPACE)/inlines.inline
VMDL_FUNCBASESPEC_NAME=funcs.spec
VMDL_FUNCBASESPEC=$(VMDL_WORKSPACE)/$(VMDL_FUNCBASESPEC_NAME)
VMDL_FUNCANYSPEC=$(VMDL_WORKSPACE)/any.spec
VMDL_FUNCNEEDSPEC=$(VMDL_WORKSPACE)/funcs-need.spec
VMDL_FUNCDEPENDENCY=$(VMDL_WORKSPACE)/dependency.ftd
VMDL_EXTERN=$(VMDL_WORKSPACE)/vmdl-extern.inc
VMDL_FUNCDPECCREQUIRE=$(VMDL_WORKSPACE)/funcscrequire.spec

EJSI_DIR=$(EJSVM_DIR)/../ejsi
EJSI=$(EJSI_DIR)/ejsi

INSNGEN_VMGEN=java -cp $(VMGEN) vmgen.InsnGen
TYPESGEN_VMGEN=java -cp $(VMGEN) vmgen.TypesGen
INSNGEN_VMDL=java -jar $(VMDL)
FUNCGEN_VMDL=$(INSNGEN_VMDL)
SPECGEN_VMDL=$(INSNGEN_VMDL)
TYPESGEN_VMDL=java -cp $(VMDL) vmdlc.TypesGen

ifeq ($(USE_VMDL),true)
SPECGEN=java -cp $(VMDL) vmdlc.SpecFileGen
SPECGEN_JAR=$(VMDL)
else
SPECGEN=java -cp $(VMGEN) vmgen.SpecFileGen
SPECGEN_JAR=$(VMGEN)
endif

CPP=$(CC) -E

CFLAGS += -std=gnu89 -Wall -Wno-unused-label -Wno-unused-result $(INCLUDES)
CXXFLAGS = -std=c++11 -Wall $(INCLUDES)

CPPFLAGS +=
LIBS   += -lm

ifeq ($(USE_VMDL),true)
CPPFLAGS += -DUSE_VMDL
CPPFLAGS_VMDL += -Wno-parentheses-equality -Wno-tautological-constant-out-of-range-compare
ifeq ($(ICC_PROF),true)
CPPFLAGS += -DICC_PROF
endif
endif

######################################################
# superinstructions

ifeq ($(SUPERINSNTYPE),1)      # S1 in Table 1 in JIP Vol.12 No.4 p.5
    SUPERINSN_MAKEINSN=true
    SUPERINSN_CUSTOMIZE_OT=false
    SUPERINSN_PSEUDO_IDEF=false
    SUPERINSN_REORDER_DISPATCH=false
else ifeq ($(SUPERINSNTYPE),2) # S4 in Table 1 in JIP Vol.12 No.4 p.5
    SUPERINSN_MAKEINSN=true
    SUPERINSN_CUSTOMIZE_OT=true
    SUPERINSN_PSEUDO_IDEF=false
    SUPERINSN_REORDER_DISPATCH=false
else ifeq ($(SUPERINSNTYPE),3) # S5 in Table 1 in JIP Vol.12 No.4 p.5
    SUPERINSN_MAKEINSN=true
    SUPERINSN_CUSTOMIZE_OT=true
    SUPERINSN_PSEUDO_IDEF=true
    SUPERINSN_REORDER_DISPATCH=false
else ifeq ($(SUPERINSNTYPE),4) # S3 in Table 1 in JIP Vol.12 No.4 p.5
    SUPERINSN_MAKEINSN=false
    SUPERINSN_CUSTOMIZE_OT=false
    SUPERINSN_PSEUDO_IDEF=false
    SUPERINSN_REORDER_DISPATCH=true
else ifeq ($(SUPERINSNTYPE),5) # S2 in Table 1 in JIP Vol.12 No.4 p.5
    SUPERINSN_MAKEINSN=false
    SUPERINSN_CUSTOMIZE_OT=false
    SUPERINSN_PSEUDO_IDEF=false
    SUPERINSN_REORDER_DISPATCH=false
endif

ifeq ($(USE_VMDL_INLINE_EXPANSION),true)
	VMDL_OPTION_INLINE=-func-inline-opt $(VMDL_INLINE)
else
	VMDL_OPTION_INLINE=
endif

ifeq ($(USE_VMDL_CASE_SPLIT),true)
	VMDL_OPTION_CASE_SPLIT=-case-split $(ICCSPEC)
else
	VMDL_OPTION_CASE_SPLIT=
endif

VMDL_OPTION_FLAGS = $(VMDL_OPTION_INLINE) $(VMDL_OPTION_CASE_SPLIT)

GENERATED_HFILES = \
    instructions-opcode.h \
    instructions-table.h \
    instructions-label.h \
    specfile-fingerprint.h

HFILES = $(GENERATED_HFILES) \
    prefix.h \
    context.h \
    header.h \
    builtin.h \
    hash.h \
    instructions.h \
    types.h \
    globals.h \
    extern.h \
    log.h \
    gc.h \
    context-inl.h \
    types-inl.h \
    gc-inl.h
ifeq ($(USE_VMDL),true)
    HFILES += vmdl-helper.h
endif

SUPERINSNS = $(shell $(GOTTA) --list-si)

OFILES = \
    allocate.o \
    builtin-array.o \
    builtin-boolean.o \
    builtin-global.o \
    builtin-math.o \
    builtin-number.o \
    builtin-object.o \
    builtin-regexp.o \
    builtin-string.o \
    builtin-function.o \
    builtin-performance.o \
    cstring.o \
    call.o \
    codeloader.o \
    context.o \
    conversion.o \
    hash.o \
    init.o \
    string.o \
    object.o \
    operations.o \
    vmloop.o \
    gc.o \
    main.o
ifeq ($(USE_VMDL),true)
OFILES += vmdl-helper.o
ifeq ($(ICC_PROF),true)
OFILES += iccprof.o
endif
endif

ifeq ($(SUPERINSN_MAKEINSN),true)
    INSN_SUPERINSNS = $(patsubst %,insns/%.inc,$(SUPERINSNS))
endif

INSN_HANDCRAFT =

FUNCS = \
	string_to_boolean \
	string_to_number \
	string_to_object \
	special_to_boolean \
	special_to_number \
	special_to_object \
	special_to_string \
	fixnum_to_string \
	fixnum_to_boolean \
	fixnum_to_object \
	flonum_to_string \
	flonum_to_boolean \
	flonum_to_object \
	number_to_string \
	object_to_string \
	object_to_boolean \
	object_to_number \
	object_to_primitive \
	to_string \
	to_boolean \
	to_number \
	to_object \
	to_double \
	special_to_double \
	number_to_cint \
	number_to_double \
	to_cint

INSNS = \
    add \
    bitand \
    bitor \
    call \
    div \
    eq \
    equal \
    getprop \
    leftshift \
    lessthan \
    lessthanequal \
    mod \
    mul \
    new \
    rightshift \
    setprop \
    sub \
    tailcall \
    unsignedrightshift \
    error \
    fixnum \
    geta \
    getarg \
    geterr \
    getglobal \
    getglobalobj \
    getlocal \
    instanceof \
    isobject \
    isundef \
    jump \
    jumpfalse \
    jumptrue \
    localcall \
    makeclosure \
    makeiterator \
    move \
    newframe \
    nextpropnameidx \
    not \
    number \
    pushhandler \
    seta \
    setarg \
    setfl \
    setglobal \
    setlocal \
    specconst \
    typeof \
    end \
    localret \
    nop \
    pophandler \
    poplocal \
    ret \
    throw \
    unknown \
	exitframe

INSN_GENERATED = $(patsubst %,insns/%.inc,$(INSNS))
FUNC_GENERATED = $(patsubst %,funcs/%.inc,$(FUNCS))
INSNS_VMD = $(patsubst %,insns-vmdl/%.vmd,$(INSNS))
FUNCS_VMD = $(patsubst %,funcs-vmdl/%.vmd,$(FUNCS))
REQUIRED_FUNCSPECS = $(patsubst %,$(VMDL_WORKSPACE)/%_require.spec,$(INSNS))

CFILES = $(patsubst %.o,%.c,$(OFILES))
CHECKFILES = $(patsubst %.c,$(CHECKFILES_DIR)/%.c,$(CFILES))
INSN_FILES = $(INSN_SUPERINSNS) $(INSN_GENERATED) $(INSN_HANDCRAFT)
FUNCS_FILES =
ifeq ($(USE_VMDL),true)
FUNCS_FILES += $(FUNC_GENERATED)
endif

######################################################

ifeq ($(GC_CXX),true)
CXX_FILES = gc.cc marksweep-collector.cc markcompact-collector.cc copy-collector.cc
HFILES    += gc-visitor-inl.h marksweep-collector.h
MARKSWEEP_COLLECTOR = marksweep-collector.o
else
CXX_FILES =
MARKSWEEP_COLLECTOR =
endif

ifeq ($(OPT_GC),native)
    CPPFLAGS+=-DUSE_NATIVEGC=1
    OFILES+=$(MARKSWEEP_COLLECTOR) freelist-space.o
    HFILES+=freelist-space.h freelist-space-inl.h
endif
ifeq ($(OPT_GC),bibop)
    CPPFLAGS+=-DUSE_NATIVEGC=1 -DBIBOP
    OFILES+=$(MARKSWEEP_COLLECTOR) bibop-space.o
    HFILES+=bibop-space.h bibop-space-inl.h
endif
ifeq ($(OPT_GC),copy)
    CPPFLAGS+=-DUSE_NATIVEGC=1 -DCOPYGC
    OFILES+=copy-collector.o
    HFILES+=copy-collector.h
endif
ifeq ($(OPT_GC),compact)
    CPPFLAGS+=-DUSE_NATIVEGC=1 -DCOMPACTION
    OFILES+=markcompact-collector.o
    HFILES+=markcompact-collector.h markcompact-collector-inl.h
endif
ifeq ($(OPT_GC),boehmgc)
    CPPFLAGS+=-DUSE_BOEHMGC=1
    LIBS+=-lgc
endif
ifeq ($(OPT_REGEXP),oniguruma)
    CPPFLAGS+=-DUSE_REGEXP=1
    LIBS+=-lonig
endif

ifeq ($(DATATYPES),)
    GENERATED_HFILES += types-handcraft.h
else
    CPPFLAGS += -DUSE_TYPES_GENERATED=1
    GENERATED_HFILES += types-generated.h
endif

CHECKFILES_DIR = checkfiles
GCCHECK_PATTERN = $(EJSVM_DIR)/gccheck.cocci

######################################################

define vmdl_funcs_preprocess
	$(FUNCGEN_VMDL) $(VMDLC_FLAGS) -Xgen:type_label true \
		-d $(DATATYPES) -o $(VMDL_FUNCANYSPEC) \
		-i $(EJSVM_DIR)/instructions.def -preprocess \
		-write-fi ${VMDL_INLINE} -write-ftd ${VMDL_FUNCDEPENDENCY} -write-extern $(VMDL_EXTERN)\
		-write-opspec-creq $(VMDL_FUNCDPECCREQUIRE)\
		$(1) \
		|| (rm $(VMDL_INLINE); rm $(VMDL_FUNCDEPENDENCY); rm $(VMDL_EXTERN); exit 1)

endef


######################################################
all: ejsvm ejsc.jar ejsi

ejsc.jar: $(EJSC)
	cp $< $@

ejsi: $(EJSI)
	cp $< $@

ejsvm :: $(OFILES) ejsvm.spec
	$(CC) $(LDFLAGS) -o $@ $(OFILES) $(LIBS)

instructions-opcode.h: $(EJSVM_DIR)/instructions.def $(SUPERINSNSPEC)
	$(GOTTA) --gen-insn-opcode -o $@

instructions-table.h: $(EJSVM_DIR)/instructions.def $(SUPERINSNSPEC)
	$(GOTTA) --gen-insn-table -o $@

instructions-label.h: $(EJSVM_DIR)/instructions.def $(SUPERINSNSPEC)
	$(GOTTA) --gen-insn-label -o $@

vmloop-cases.inc: $(EJSVM_DIR)/instructions.def
	$(GOTTA) --gen-vmloop-cases -o $@

ifeq ($(SUPERINSNTYPE),)
ejsvm.spec: $(EJSVM_DIR)/instructions.def $(SPECGEN_JAR)
	$(SPECGEN) --insndef $(EJSVM_DIR)/instructions.def -o ejsvm.spec\
		--fingerprint specfile-fingerprint.h
specfile-fingerprint.h: ejsvm.spec
	touch $@
else
ejsvm.spec specfile-fingerprint.h: $(EJSVM_DIR)/instructions.def $(SUPERINSNSPEC) $(SPECGEN_JAR)
	$(SPECGEN) --insndef $(EJSVM_DIR)/instructions.def\
		--sispec $(SUPERINSNSPEC) -o ejsvm.spec\
		--fingerprint specfile-fingerprint.h
endif

$(INSN_HANDCRAFT):insns/%.inc: $(EJSVM_DIR)/insns-handcraft/%.inc
	mkdir -p insns
	cp $< $@

insns-vmdl/%.vmd: $(EJSVM_DIR)/insns-vmdl/%.vmd $(EJSVM_DIR)/header-vmdl/externc.vmdh
	mkdir -p insns-vmdl
	$(CPP_VMDL) $< > $@ || (rm $@; exit 1)

funcs-vmdl/%.vmd: $(EJSVM_DIR)/funcs-vmdl/%.vmd
	mkdir -p funcs-vmdl
	$(CPP_VMDL) $< > $@ || (rm $@; exit 1)

ifeq ($(DATATYPES),)
$(INSN_GENERATED):insns/%.inc: $(EJSVM_DIR)/insns-handcraft/%.inc
	mkdir -p insns
	cp $< $@
else ifeq ($(SUPERINSN_REORDER_DISPATCH),true)

ifeq ($(USE_VMDL), true)
$(VMDL_FUNCANYSPEC): 
	mkdir -p $(VMDL_WORKSPACE)
	cp $(EJSVM_DIR)/function-spec/any.spec $@
$(VMDL_FUNCNEEDSPEC): $(VMDL) $(VMDL_FUNCBASESPEC) $(VMDL_FUNCDEPENDENCY)
	mkdir -p $(VMDL_WORKSPACE)
	$(FUNCGEN_VMDL) -gen-funcspec $(VMDL_FUNCDEPENDENCY) $(VMDL_FUNCBASESPEC) $@ || (rm $@; exit 1)
$(VMDL_FUNCDEPENDENCY) $(VMDL_EXTERN) $(VMDL_FUNCDPECCREQUIRE): $(VMDL_INLINE)
$(VMDL_INLINE): $(VMDL) $(FUNCS_VMD) $(VMDL_FUNCANYSPEC)
	mkdir -p $(VMDL_WORKSPACE)
	rm -f $(VMDL_INLINE)
	rm -f $(VMDL_FUNCDEPENDENCY)
	rm -f $(VMDL_EXTERN)
	rm -f $(VMDL_FUNCDPECCREQUIRE)
	touch $(VMDL_FUNCDEPENDENCY)
	$(foreach FILE_VMD, $(FUNCS_VMD), $(call vmdl_funcs_preprocess,$(FILE_VMD)))
$(VMDL_FUNCBASESPEC): $(VMDL) $(REQUIRED_FUNCSPECS)
	$(SPECGEN_VMDL) -merge-funcspec $(REQUIRED_FUNCSPECS) > $@ || (rm $@; exit 1)
$(REQUIRED_FUNCSPECS):$(VMDL_WORKSPACE)/%_require.spec: insns/%.inc
$(INSN_GENERATED):insns/%.inc: insns-vmdl/%.vmd $(VMDL) $(VMDL_INLINE) $(VMDL_FUNCDPECCREQUIRE)
	mkdir -p $(VMDL_WORKSPACE)
	cp -n $(VMDL_FUNCDPECCREQUIRE) $(patsubst insns/%.inc,$(VMDL_WORKSPACE)/%_require.spec,$@)
	mkdir -p insns
	$(INSNGEN_VMDL) $(VMDLC_FLAGS) $(VMDL_OPTION_FLAGS)\
		-Xgen:type_label true \
		-Xcmp:tree_layer \
		`$(GOTTA) --print-dispatch-order $(patsubst insns/%.inc,%,$@)` \
		-d $(DATATYPES) -o $(OPERANDSPEC) -i $(EJSVM_DIR)/instructions.def \
		-update-funcspec $(patsubst insns/%.inc,$(VMDL_WORKSPACE)/%_require.spec,$@) $< > $@ || (rm $@; exit 1)
$(FUNC_GENERATED):funcs/%.inc: funcs-vmdl/%.vmd $(VMDL) $(VMDL_FUNCNEEDSPEC)
	mkdir -p funcs
	$(FUNCGEN_VMDL) $(VMDLC_FLAGS) \
		-Xgen:type_label true \
	-d $(DATATYPES) -o $(VMDL_FUNCNEEDSPEC) -i $(EJSVM_DIR)/instructions.def $< > $@ || (rm $@; exit 1)
else
$(INSN_GENERATED):insns/%.inc: $(EJSVM_DIR)/insns-def/%.idef $(VMGEN)
	mkdir -p insns
	$(INSNGEN_VMGEN) $(INSNGEN_FLAGS) \
		-Xgen:type_label true \
		-Xcmp:tree_layer \
		`$(GOTTA) --print-dispatch-order $(patsubst insns/%.inc,%,$@)` \
		$(DATATYPES) $< $(OPERANDSPEC) insns
endif
else
ifeq ($(USE_VMDL), true)
$(VMDL_FUNCANYSPEC): 
	mkdir -p $(VMDL_WORKSPACE)
	cp $(EJSVM_DIR)/function-spec/any.spec $@
$(VMDL_FUNCNEEDSPEC): $(VMDL) $(VMDL_FUNCBASESPEC) $(VMDL_FUNCDEPENDENCY)
	mkdir -p $(VMDL_WORKSPACE)
	$(FUNCGEN_VMDL) -gen-funcspec $(VMDL_FUNCDEPENDENCY) $(VMDL_FUNCBASESPEC) $@ || (rm $@; exit 1)
$(VMDL_FUNCDEPENDENCY) $(VMDL_EXTERN) $(VMDL_FUNCDPECCREQUIRE): $(VMDL_INLINE)
$(VMDL_INLINE): $(VMDL) $(FUNCS_VMD) $(VMDL_FUNCANYSPEC)
	mkdir -p $(VMDL_WORKSPACE)
	rm -f $(VMDL_INLINE)
	rm -f $(VMDL_FUNCDEPENDENCY)
	rm -f $(VMDL_EXTERN)
	rm -f $(VMDL_FUNCDPECCREQUIRE)
	touch $(VMDL_FUNCDEPENDENCY)
	$(foreach FILE_VMD, $(FUNCS_VMD), $(call vmdl_funcs_preprocess,$(FILE_VMD)))
$(VMDL_FUNCBASESPEC): $(VMDL) $(REQUIRED_FUNCSPECS)
	$(SPECGEN_VMDL) -merge-funcspec $(REQUIRED_FUNCSPECS) > $@ || (rm $@; exit 1)
$(REQUIRED_FUNCSPECS):$(VMDL_WORKSPACE)/%_require.spec: insns/%.inc
$(INSN_GENERATED):insns/%.inc: insns-vmdl/%.vmd $(VMDL) $(VMDL_INLINE) $(VMDL_FUNCDPECCREQUIRE)
	mkdir -p $(VMDL_WORKSPACE)
	cp -n $(VMDL_FUNCDPECCREQUIRE) $(patsubst insns/%.inc,$(VMDL_WORKSPACE)/%_require.spec,$@)
	mkdir -p insns
	$(INSNGEN_VMDL) $(VMDLC_FLAGS) $(VMDL_OPTION_FLAGS)\
		-Xgen:type_label true \
		-Xcmp:tree_layer p0:p1:p2:h0:h1:h2 \
		-d $(DATATYPES) -o $(OPERANDSPEC) -i $(EJSVM_DIR)/instructions.def \
		-update-funcspec $(patsubst insns/%.inc,$(VMDL_WORKSPACE)/%_require.spec,$@) $< > $@ || (rm $@; exit 1)
$(FUNC_GENERATED):funcs/%.inc: funcs-vmdl/%.vmd $(VMDL) $(VMDL_FUNCNEEDSPEC)
	mkdir -p funcs
	$(FUNCGEN_VMDL) $(VMDLC_FLAGS) \
		-Xgen:type_label true \
		-Xcmp:tree_layer p0:p1:p2:h0:h1:h2 \
	-d $(DATATYPES) -o $(VMDL_FUNCNEEDSPEC) -i $(EJSVM_DIR)/instructions.def $< > $@ || (rm $@; exit 1)
else
$(INSN_GENERATED):insns/%.inc: $(EJSVM_DIR)/insns-def/%.idef $(VMGEN)
	mkdir -p insns
	$(INSNGEN_VMGEN) $(INSNGEN_FLAGS) \
		-Xgen:type_label true \
		-Xcmp:tree_layer p0:p1:p2:h0:h1:h2 \
		$(DATATYPES) $< $(OPERANDSPEC) insns
endif
endif

# generate si-otspec/*.ot for each superinsns
SI_OTSPEC_DIR = si/otspec
SI_OTSPECS = $(patsubst %,$(SI_OTSPEC_DIR)/%.ot,$(SUPERINSNS))
ifeq ($(SUPERINSN_CUSTOMIZE_OT),true)
$(SI_OTSPECS): $(OPERANDSPEC) $(SUPERINSNSPEC)
	mkdir -p $(SI_OTSPEC_DIR)
	$(GOTTA) --gen-ot-spec $(patsubst $(SI_OTSPEC_DIR)/%.ot,%,$@) -o $@
else
$(SI_OTSPECS): $(OPERANDSPEC)
	mkdir -p $(SI_OTSPEC_DIR)
	cp $< $@
endif


# generate insns/*.inc for each superinsns
ifeq ($(DATATYPES),)
$(INSN_SUPERINSNS):
	echo "Superinstruction needs DATATYPES specified"
	exit 1
else

SI_IDEF_DIR = si/idefs
orig_insn = \
    $(shell $(GOTTA) --print-original-insn-name $(patsubst insns/%.inc,%,$1))
tmp_idef = $(SI_IDEF_DIR)/$(patsubst insns/%.inc,%,$1)

ifeq ($(SUPERINSN_PSEUDO_IDEF),true)
ifeq ($(USE_VMDL), true)
$(INSN_SUPERINSNS):insns/%.inc: $(EJSVM_DIR)/insns-vmdl/* $(SUPERINSNSPEC) $(SI_OTSPEC_DIR)/%.ot $(VMDL)
	mkdir -p $(SI_IDEF_DIR)
	$(GOTTA) \
		--gen-pseudo-vmdl $(call orig_insn,$@) $(patsubst insns/%.inc,%,$@) \
		-o $(call tmp_idef,$@).vmd
	mkdir -p insns
	$(INSNGEN_VMDL) $(VMDLC_FLAGS) \
		-Xgen:label_prefix $(patsubst insns/%.inc,%,$@) \
		-Xcmp:tree_layer p0:p1:p2:h0:h1:h2 \
		-d $(DATATYPES) \
		-i $(EJSVM_DIR)/instructions.def \
		-o $(patsubst insns/%.inc,$(SI_OTSPEC_DIR)/%.ot,$@) \
		$(call tmp_idef,$@).vmd > $@ || (rm $@; exit 1)
else
$(INSN_SUPERINSNS):insns/%.inc: $(EJSVM_DIR)/insns-def/* $(SUPERINSNSPEC) $(SI_OTSPEC_DIR)/%.ot $(VMGEN)
	mkdir -p $(SI_IDEF_DIR)
	$(GOTTA) \
		--gen-pseudo-idef $(call orig_insn,$@) \
		-o $(call tmp_idef,$@).idef
	mkdir -p insns
	$(INSNGEN_VMGEN) $(INSNGEN_FLAGS) \
		-Xgen:label_prefix $(patsubst insns/%.inc,%,$@) \
		-Xcmp:tree_layer p0:p1:p2:h0:h1:h2 $(DATATYPES) \
		$(call tmp_idef,$@).idef \
		$(patsubst insns/%.inc,$(SI_OTSPEC_DIR)/%.ot,$@) > $@ || (rm $@; exit 1)
endif
else
ifeq ($(USE_VMDL), true)
$(INSN_SUPERINSNS):insns/%.inc: $(EJSVM_DIR)/insns-vmdl/* $(SUPERINSNSPEC) $(SI_OTSPEC_DIR)/%.ot $(VMDL) insns-vmdl/*.vmd
	mkdir -p insns
	$(INSNGEN_VMDL) $(VMDLC_FLAGS) \
		-Xgen:label_prefix $(patsubst insns/%.inc,%,$@) \
		-Xcmp:tree_layer p0:p1:p2:h0:h1:h2 \
		-d $(DATATYPES) \
		-i $(EJSVM_DIR)/instructions.def \
		-o $(patsubst insns/%.inc,$(SI_OTSPEC_DIR)/%.ot,$@) \
		insns-vmdl/$(call orig_insn,$@).vmd > $@ || (rm $@; exit 1)
else
$(INSN_SUPERINSNS):insns/%.inc: $(EJSVM_DIR)/insns-def/* $(SUPERINSNSPEC) $(SI_OTSPEC_DIR)/%.ot $(VMGEN)
	mkdir -p insns
	$(INSNGEN_VMGEN) $(INSNGEN_FLAGS) \
		-Xgen:label_prefix $(patsubst insns/%.inc,%,$@) \
		-Xcmp:tree_layer p0:p1:p2:h0:h1:h2 $(DATATYPES) \
		$(EJSVM_DIR)/insns-def/$(call orig_insn,$@).idef \
		$(patsubst insns/%.inc,$(SI_OTSPEC_DIR)/%.ot,$@) > $@ || (rm $@; exit 1)
endif
endif
endif

instructions.h: instructions-opcode.h instructions-table.h

$(CXX_FILES):%.cc: $(EJSVM_DIR)/%.cc
	cp $< $@

%.c:: $(EJSVM_DIR)/%.c $(FUNCS_FILES)
	cp $< $@

%.h:: $(EJSVM_DIR)/%.h
	cp $< $@

vmloop.o: vmloop.c vmloop-cases.inc $(INSN_FILES) $(HFILES)
	$(CC) -c $(CPPFLAGS) $(CFLAGS) $(CPPFLAGS_VMDL) -o $@ $<

#gc.o:%.o:%.cc $(HFILES)
$(patsubst %.cc,%.o,$(CXX_FILES)):%.o:%.cc $(HFILES)
	echo $(CPPFLAGS)
	echo $(CXXFLAGS)
	$(CXX) -c $(CPPFLAGS) $(CXXFLAGS) -o $@ $<

conversion.o: conversion.c $(FUNCS_FILES) $(HFILES)
	$(CC) -c $(CPPFLAGS) $(CFLAGS) -o $@ $<

%.o: %.c $(HFILES)
	$(CC) -c $(CPPFLAGS) $(CFLAGS) -o $@ $<

ifeq ($(USE_VMDL),true)
extern.h: $(VMDL_EXTERN)
endif

#### vmgen
$(VMGEN):
	(cd $(VMGEN_DIR); ant)

#### vmdl
$(VMDL):
	(cd $(VMDL_DIR); ant)

#### ejsc
$(EJSC): $(VMGEN) ejsvm.spec
	(cd $(EJSC_DIR); ant clean; ant -Dspecfile=$(CURDIR)/ejsvm.spec)

#### ejsi
$(EJSI):
	make -C $(EJSI_DIR)

#### check

CHECKFILES   = $(patsubst %.c,$(CHECKFILES_DIR)/%.c,$(CFILES))
CHECKRESULTS = $(patsubst %.c,$(CHECKFILES_DIR)/%.c.checkresult,$(CFILES))
CHECKTARGETS = $(patsubst %.c,%.c.check,$(CFILES))

ifeq ($(USE_VMDL),true)
types-generated.h: $(DATATYPES) $(VMDL)
	$(TYPESGEN_VMDL) $< > $@ || (rm $@; exit 1)
else
types-generated.h: $(DATATYPES) $(VMGEN)
	$(TYPESGEN_VMGEN) $< > $@ || (rm $@; exit 1)
endif

$(CHECKFILES):$(CHECKFILES_DIR)/%.c: %.c $(HFILES)
	mkdir -p $(CHECKFILES_DIR)
	$(CPP) $(CPPFLAGS) $(CFLAGS) -DCOCCINELLE_CHECK=1 $< > $@ || (rm $@; exit 1)

$(CHECKFILES_DIR)/vmloop.c: vmloop-cases.inc $(INSN_FILES)

.PHONY: %.check
$(CHECKTARGETS):%.c.check: $(CHECKFILES_DIR)/%.c
	$(COCCINELLE) --sp-file $(GCCHECK_PATTERN) $<

$(CHECKRESULTS):$(CHECKFILES_DIR)/%.c.checkresult: $(CHECKFILES_DIR)/%.c
	$(COCCINELLE) --sp-file $(GCCHECK_PATTERN) $< > $@ || (rm $@; exit 1)

check: $(CHECKRESULTS)
	cat $^

#### clean

clean:
	rm -f *.o $(GENERATED_HFILES) vmloop-cases.inc *.c *.cc *.h
	rm -rf insns
	rm -rf funcs
	rm -f *.checkresult
	rm -rf $(CHECKFILES_DIR)
	rm -rf si
	rm -rf insns-vmdl
	rm -rf funcs-vmdl
	rm -rf vmdl_workspace
	rm -f ejsvm ejsvm.spec ejsi ejsc.jar

cleanest:
	rm -f *.o $(GENERATED_HFILES) vmloop-cases.inc *.c *.cc *.h
	rm -rf insns
	rm -rf funcs
	rm -f *.checkresult
	rm -rf $(CHECKFILES_DIR)
	rm -rf si
	rm -rf insns-vmdl
	rm -rf funcs-vmdl
	rm -rf vmdl_workspace
	rm -f ejsvm ejsvm.spec ejsi ejsc.jar
	(cd $(VMGEN_DIR); ant clean)
	rm -f $(VMGEN)
	(cd $(VMDL_DIR); ant clean)
	rm -f $(VMDL)
	(cd $(EJSC_DIR); ant clean)
	rm -f $(EJSC)
	make -C $(EJSI_DIR) clean
