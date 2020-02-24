from django.shortcuts import render
from django import forms
from django.http import HttpResponseRedirect
from django.http import HttpResponse
from django.urls import reverse

import re
import random

from . import util

#django forms
class NewPageForm(forms.Form):
    title = forms.CharField(label="Page Title")
    content = forms.CharField(widget=forms.Textarea, label="Page Content")

class EditPageForm(forms.Form):
    title = forms.CharField(label="Page Title")
    content = forms.CharField(widget=forms.Textarea, label="Page Content")

def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })

def editpage(request, title):
    if request.method == "POST":
        form = EditPageForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data["title"]
            content = form.cleaned_data["content"]
            util.save_entry(title, content)
            return render(request, "encyclopedia/entry.html", {
                "entry": util.get_entry(title),
                "title": title.capitalize()
            })
        else:
            return render(request, "encyclopedia/editpage.html", {
                "form": form
            })
    return render(request, "encyclopedia/editpage.html", {
        "title": title,
        "form": EditPageForm(initial={'title':title})
    })


def newpage(request):
    if request.method == "POST":
        form = NewPageForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data["title"]
            content = form.cleaned_data["content"]
            #checking for duplicates
            entrylist = util.list_entries()
            for entrytitle in entrylist:
                tempentrytitle = entrytitle.lower()
                temptitle = title.lower()
                if temptitle == tempentrytitle:
                    #exit / raise warning
                    return HttpResponse("That article already exists. Please choose a different name.")
            util.save_entry(title, content)
            return render(request, "encyclopedia/entry.html", {
                "entry": util.get_entry(title),
                "title": title.capitalize()
            })
        else:
            return render(request, "encyclopedia/newpage.html", {
                "form": form
            })

    return render(request, "encyclopedia/newpage.html", {
        "form": NewPageForm()
    })

def entries(request, title):
    mdentry = util.get_entry(title)
    # replacing bolds
    mdentry = re.sub(r"\*\*(.*?)\*\*", "<strong>\\1</strong>", mdentry)
    mdentry = re.sub(r"\[(.*?)\]", "<a href="">\\1</a>", mdentry)
    mdentry = re.sub(r"\# (.*?)", "<h1>\\1</h1>", mdentry)
    return render(request, "encyclopedia/entry.html", {
        "entry": mdentry,
        "title": title.capitalize()
    })

def randomentry(request):
    entrylist = util.list_entries()
    title = random.choice(entrylist)
    entry = util.get_entry(title)

    return render(request, "encyclopedia/entry.html", {
        "entry": entry,
        "title": title
    })

def search(request, q):
    q = request.GET[q]
    entrylist = util.list_entries()
    resultslist = []

    for entrytitle in entrylist:
        tempentrytitle = entrytitle.lower()
        if q == tempentrytitle:
            return render(request, "encyclopedia/entry.html", {
                "entry": util.get_entry(q),
                "title": entrytitle
            })

        elif q in tempentrytitle:
            #partial string match
            #add that title to a templist to be displayed later
            resultslist.append(entrytitle)

    return render(request, "encyclopedia/searchresults.html", {
        "query": q,
        "entrylist": entrylist,
        "resultslist": resultslist
    })